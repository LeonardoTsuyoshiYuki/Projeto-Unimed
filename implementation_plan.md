# Plano de Implementação - Infraestrutura de Produção e Monitoramento

Baseado nos "Próximos Passos Recomendados" do HANDOVER_REPORT.md.

## 1. Infraestrutura de Produção

### 1.1. Configuração de E-mail (SMTP)
- [x] Configurar provedor de e-mail produtivo (Defaults to Brevo/SMTP in `settings.py` via env vars).
- [x] Implementar adaptador de e-mail seguro em `backend/core/services/email/providers/django.py`.
- [ ] Testar envio de e-mail (recuperação de senha, notificações).

### 1.2. Domínio e SSL
- [ ] Configurar `ALLOWED_HOSTS` e `CSRF_TRUSTED_ORIGINS` para domínio real.
- [ ] Validar configuração de `SECURE_SSL_REDIRECT` e headers de segurança.

### 1.3. CORS
- [x] Ajustar `CORS_ALLOWED_ORIGINS` para restringir acesso apenas ao frontend de produção (Logica condicional implementada no `settings.py`).

## 2. Monitoramento e Manutenção

### 2.1. Sentry (Error Tracking)
- [x] Instalar SDK do Sentry (`requirements.txt`).
- [x] Configurar DSN no `.env` e inicialização no `settings.py`.
- [ ] Testar captura de exceções.


### 2.2. Backups
- [x] Criar script de backup automático do PostgreSQL (`scripts/backup.ps1` & `scripts/backup.sh`).
- [ ] Configurar cronjob ou serviço para execução periódica.


## 3. Melhorias Finais
- [ ] Revisão final de variáveis de ambiente.
- [ ] Teste de carga simples.
