from .interfaces import EmailResult

class EmailService:
    def __init__(self, provider):
        self.provider = provider

    def send(self, to, subject, content, html_content=None) -> EmailResult:
        # Assuming single recipient for simple wrapper
        return self.provider.send(
            to_emails=[to],
            subject=subject,
            text_content=content,
            html_content=html_content or content
        )
