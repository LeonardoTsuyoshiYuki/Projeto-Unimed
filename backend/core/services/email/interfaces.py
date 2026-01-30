from typing import List, Optional, Any
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

@dataclass
class EmailResult:
    success: bool
    provider: str
    status: str # "sent", "queued", "failed", "simulated"
    details: dict = field(default_factory=dict)
    message_id: Optional[str] = None
    http_status: Optional[int] = None
    error: Optional[str] = None

class EmailProvider(ABC):
    """
    Abstract Base Class for Email Providers.
    Defines the contract for sending emails, allowing implementation swappability (Adapter Pattern).
    """

    @abstractmethod
    def send(self, 
             subject: str, 
             to_emails: List[str], 
             html_content: str, 
             text_content: str,
             from_email: Optional[str] = None,
             from_name: Optional[str] = None) -> EmailResult:
        """
        Send an email and return a detailed result object.
        """
        pass
