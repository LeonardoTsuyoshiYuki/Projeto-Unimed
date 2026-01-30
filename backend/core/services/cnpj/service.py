from .interfaces import CNPJResult
from .providers import BrasilAPICNPJProvider

class CNPJService:
    def __init__(self, provider=None):
        self.provider = provider or BrasilAPICNPJProvider()

    def validate_cnpj(self, cnpj: str) -> CNPJResult:
        # Basic format validation first
        clean_cnpj = ''.join(filter(str.isdigit, cnpj))
        if len(clean_cnpj) != 14:
             return CNPJResult(valid=False, status='INVALID_FORMAT', message='CNPJ deve ter 14 dígitos.')
             
        return self.provider.validate(clean_cnpj)
