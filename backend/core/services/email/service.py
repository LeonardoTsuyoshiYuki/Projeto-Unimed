from .interfaces import EmailResult

class EmailService:
    def __init__(self, provider):
        self.provider = provider

    def send(self, to, subject, content) -> EmailResult:
        # Assuming single recipient for simple wrapper
        return self.provider.send(
            to_emails=[to],
            subject=subject,
            text_content=content,
            html_content=content # Simple fallback, could be improved to accept both
        )
