from dataclasses import dataclass
from typing import Optional, Protocol

@dataclass
class CNPJResult:
    valid: bool
    status: str # 'ATIVA', 'BAIXADA', etc.
    message: str # User friendly message
    details: Optional[dict] = None # Full API response or error details

class CNPJProvider(Protocol):
    def validate(self, cnpj: str) -> CNPJResult:
        ...
