"""
Chat router - /api/v1/chat
Handles messaging between buyers and agents about properties.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.models import User, ChatRoom, ChatMessage, Property

router = APIRouter()


class SendMessageRequest(BaseModel):
    room_id: str
    content: str


class EnquireRequest(BaseModel):
    property_id: str
    message: str


@router.post("/enquire")
async def enquire_about_property(
    payload: EnquireRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a chat about a property or send to existing room."""
    # Get property
    prop = await db.get(Property, payload.property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Check for existing room
    existing = await db.execute(
        select(ChatRoom).where(
            and_(
                ChatRoom.property_id == payload.property_id,
                ChatRoom.client_id == current_user.id,
            )
        )
    )
    room = existing.scalar_one_or_none()

    # Create room if not exists
    if not room:
        room = ChatRoom(
            property_id=payload.property_id,
            client_id=current_user.id,
            agent_id=prop.agent_id,
            status="active",
        )
        db.add(room)
        await db.flush()

        # Increment property inquiries
        prop.inquiries = (prop.inquiries or 0) + 1

    # Add message
    msg = ChatMessage(
        room_id=room.id,
        sender_id=current_user.id,
        content=payload.message,
        message_type="text",
    )
    db.add(msg)
    room.last_message_at = datetime.now(timezone.utc)
    await db.commit()

    # Send email notification to agent
    agent = await db.get(User, prop.agent_id)
    if agent:
        from app.services.email_service import send_enquiry_to_agent_email, send_enquiry_confirmation_to_buyer_email
        try:
            await send_enquiry_to_agent_email(
                agent.email, agent.full_name,
                current_user.full_name, prop.title, payload.message
            )
            await send_enquiry_confirmation_to_buyer_email(
                current_user.email, current_user.full_name, prop.title
            )
        except:
            pass

    return {
        "room_id": room.id,
        "message_id": msg.id,
        "property_title": prop.title,
        "status": "sent",
    }


@router.get("/rooms")
async def get_my_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all chat rooms for the current user."""
    result = await db.execute(
        select(ChatRoom).where(
            or_(
                ChatRoom.client_id == current_user.id,
                ChatRoom.agent_id == current_user.id,
            )
        ).order_by(ChatRoom.last_message_at.desc().nullslast())
    )
    rooms = result.scalars().all()

    output = []
    for room in rooms:
        prop = await db.get(Property, room.property_id)
        other_user_id = room.agent_id if current_user.id == room.client_id else room.client_id
        other_user = await db.get(User, other_user_id)

        # Get last message
        last_msg_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.room_id == room.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()

        # Count unread messages
        unread_result = await db.execute(
            select(ChatMessage).where(
                and_(
                    ChatMessage.room_id == room.id,
                    ChatMessage.sender_id != current_user.id,
                    ChatMessage.read_at == None,
                )
            )
        )
        unread_count = len(unread_result.scalars().all())

        output.append({
            "id": room.id,
            "property_id": room.property_id,
            "property_title": prop.title if prop else "Unknown Property",
            "other_user_name": other_user.full_name if other_user else "Unknown",
            "other_user_initials": "".join(w[0] for w in (other_user.full_name if other_user else "U U").split())[:2].upper(),
            "last_message": last_msg.content if last_msg else None,
            "last_message_at": last_msg.created_at.isoformat() if last_msg else None,
            "unread_count": unread_count,
            "status": room.status,
        })

    return {"rooms": output, "total": len(output)}


@router.get("/rooms/{room_id}/messages")
async def get_messages(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages in a chat room."""
    room = await db.get(ChatRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if current_user.id not in (room.client_id, room.agent_id):
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()

    # Mark messages as read
    for msg in messages:
        if msg.sender_id != current_user.id and not msg.read_at:
            msg.read_at = datetime.now(timezone.utc)
    await db.commit()

    prop = await db.get(Property, room.property_id)
    other_user_id = room.agent_id if current_user.id == room.client_id else room.client_id
    other_user = await db.get(User, other_user_id)

    return {
        "room_id": room_id,
        "property_title": prop.title if prop else "Unknown",
        "other_user_name": other_user.full_name if other_user else "Unknown",
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "sender_id": msg.sender_id,
                "is_mine": msg.sender_id == current_user.id,
                "created_at": msg.created_at.isoformat(),
                "read_at": msg.read_at.isoformat() if msg.read_at else None,
            }
            for msg in messages
        ],
    }


@router.post("/rooms/{room_id}/messages")
async def send_message(
    room_id: str,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message in a chat room."""
    room = await db.get(ChatRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if current_user.id not in (room.client_id, room.agent_id):
        raise HTTPException(status_code=403, detail="Access denied")

    msg = ChatMessage(
        room_id=room_id,
        sender_id=current_user.id,
        content=payload.content,
        message_type="text",
    )
    db.add(msg)
    room.last_message_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "id": msg.id,
        "content": msg.content,
        "sender_id": msg.sender_id,
        "is_mine": True,
        "created_at": msg.created_at.isoformat(),
    }
