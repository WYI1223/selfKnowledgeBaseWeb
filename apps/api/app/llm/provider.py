"""LLMProvider abstract interface (spec §2.6 mandatory item #4).

Wave 1 freezes this interface; Wave 2b implements concrete providers
(AnthropicProvider, etc.). apps/api code MUST NOT import vendor SDKs
directly — every LLM call goes through an LLMProvider instance.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Protocol


class ChatMessage(Protocol):
    role: str
    content: str


class LLMProvider(ABC):
    """Phase 1 freezes this interface; Phase 2b implements concrete providers."""

    name: str

    @abstractmethod
    def stream(
        self,
        messages: list[ChatMessage],
        *,
        tools: list[dict] | None = None,
        system: str | None = None,
    ) -> AsyncIterator[dict]:
        """Yield SSE-shaped events: {type: 'text'|'tool_use'|'stop', ...}.

        Returns an async iterator. Implementations should be `async def` with
        `yield` inside, which makes the function itself an async generator
        (callers do `async for event in provider.stream(...)`).
        """
        raise NotImplementedError
