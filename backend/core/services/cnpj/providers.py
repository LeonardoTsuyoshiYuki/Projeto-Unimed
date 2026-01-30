import requests
import logging
from .interfaces import CNPJProvider, CNPJResult

logger = logging.getLogger(__name__)

class BrasilAPICNPJProvider(CNPJProvider):
    BASE_URL = "https://brasilapi.com.br/api/cnpj/v1"

    def validate(self, cnpj: str) -> CNPJResult:
        clean_cnpj = ''.join(filter(str.isdigit, cnpj))
        
        try:
            response = requests.get(f"{self.BASE_URL}/{clean_cnpj}", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                situation = data.get('descricao_situacao_cadastral', '').upper()
                
                # BrasilAPI returns 'descricao_situacao_cadastral': 'ATIVA' usually
                # But let's check exact field. Docs say 'descricao_situacao_cadastral'
                
                if situation == 'ATIVA':
                    return CNPJResult(
                        valid=True,
                        status='ATIVA',
                        message='CNPJ Ativo.',
                        details=data
                    )
                else:
                    return CNPJResult(
                        valid=False,
                        status=situation,
                        message=f'CNPJ com situação {situation} na Receita Federal.',
                        details=data
                    )
            elif response.status_code == 404:
                return CNPJResult(
                    valid=False,
                    status='NOT_FOUND',
                    message='CNPJ não encontrado na base da Receita Federal.'
                )
            else:
                 logger.warning(f"BrasilAPI Error: {response.status_code} - {response.text}")
                 return CNPJResult(
                    valid=False,
                    status='ERROR',
                    message='Erro ao consultar CNPJ. Tente novamente mais tarde.',
                    details={'status_code': response.status_code}
                 )

        except requests.Timeout:
            logger.error("BrasilAPI Timeout")
            return CNPJResult(
                valid=False,
                status='TIMEOUT',
                message='Tempo limite excedido na validação do CNPJ.'
            )
        except Exception as e:
            logger.error(f"BrasilAPI Exception: {str(e)}")
            return CNPJResult(
                valid=False,
                status='EXCEPTION',
                message='Erro interno na validação do CNPJ.',
                details={'error': str(e)}
            )
