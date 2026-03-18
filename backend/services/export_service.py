"""Export service for PDF generation and email delivery."""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import Optional
from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from models import Report
from services.error_handling import retry_with_backoff


class ExportService:
    """Service for exporting reports and sending via email."""
    
    def __init__(self, smtp_config: Optional[dict] = None):
        """
        Initialize export service.
        
        Args:
            smtp_config: SMTP configuration dictionary
        """
        self.smtp_config = smtp_config or {
            "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
            "port": int(os.getenv("SMTP_PORT", "587")),
            "username": os.getenv("SMTP_USERNAME", ""),
            "password": os.getenv("SMTP_PASSWORD", ""),
            "from_email": os.getenv("SMTP_FROM_EMAIL", "noreply@swasthai.com")
        }
    
    async def generate_pdf(self, report: Report) -> bytes:
        """
        Generate PDF export of report analysis.
        
        Args:
            report: Report object with analysis data
            
        Returns:
            PDF content as bytes
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        
        # Build PDF content
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=12,
            spaceBefore=20
        )
        
        # Title
        story.append(Paragraph("Medical Report Analysis", title_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # Report Info
        info_data = [
            ["Report Name:", report.filename],
            ["Upload Date:", report.upload_date.strftime("%B %d, %Y")],
            ["Category:", report.category],
            ["Health Score:", f"{report.health_score}/100"]
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Health Markers
        if report.markers:
            story.append(Paragraph("Lab Markers", heading_style))
            
            marker_data = [["Marker", "Value", "Status", "Reference Range"]]
            for marker in report.markers:
                marker_data.append([
                    marker.name,
                    marker.value,
                    marker.status.upper(),
                    marker.reference_range or "N/A"
                ])
            
            marker_table = Table(marker_data, colWidths=[2*inch, 1.5*inch, 1*inch, 1.5*inch])
            marker_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ]))
            
            story.append(marker_table)
            story.append(Spacer(1, 0.2 * inch))
        
        # Deficiencies
        if report.deficiencies:
            story.append(Paragraph("Detected Deficiencies", heading_style))
            for deficiency in report.deficiencies:
                story.append(Paragraph(f"• {deficiency.name}", styles['Normal']))
            story.append(Spacer(1, 0.2 * inch))
        
        # Warnings
        if report.warnings:
            story.append(Paragraph("Health Warnings", heading_style))
            for warning in report.warnings:
                story.append(Paragraph(f"⚠ {warning.message}", styles['Normal']))
            story.append(Spacer(1, 0.2 * inch))
        
        # Suggestions
        if report.suggestions:
            story.append(Paragraph("Dietary Suggestions", heading_style))
            for suggestion in report.suggestions:
                story.append(Paragraph(f"✓ {suggestion.text}", styles['Normal']))
            story.append(Spacer(1, 0.2 * inch))
        
        # Disclaimer
        story.append(Spacer(1, 0.3 * inch))
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#64748b'),
            alignment=TA_CENTER
        )
        story.append(Paragraph(
            "⚕ Disclaimer: This analysis is AI-generated and not a substitute for professional medical advice. "
            "Always consult a qualified doctor.",
            disclaimer_style
        ))
        
        # Build PDF
        doc.build(story)
        
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content
    
    async def send_email(
        self,
        recipient: str,
        report: Report,
        pdf_content: bytes,
        max_retries: int = 3
    ) -> bool:
        """
        Send report via email with retry logic.
        
        Args:
            recipient: Recipient email address
            report: Report object
            pdf_content: PDF file content
            max_retries: Maximum number of retry attempts
            
        Returns:
            True if email sent successfully
        """
        async def _send():
            return self._send_email_sync(recipient, report, pdf_content)
        
        try:
            await retry_with_backoff(_send, max_retries=max_retries)
            return True
        except Exception as e:
            print(f"Failed to send email after {max_retries} attempts: {e}")
            return False
    
    def _send_email_sync(
        self,
        recipient: str,
        report: Report,
        pdf_content: bytes
    ) -> bool:
        """
        Send email synchronously.
        
        Args:
            recipient: Recipient email address
            report: Report object
            pdf_content: PDF file content
            
        Returns:
            True if sent successfully
        """
        # Create message
        msg = MIMEMultipart()
        msg['From'] = self.smtp_config['from_email']
        msg['To'] = recipient
        msg['Subject'] = f"Medical Report Analysis - {report.filename}"
        
        # Email body
        body = self._create_email_body(report)
        msg.attach(MIMEText(body, 'html'))
        
        # Attach PDF
        pdf_attachment = MIMEApplication(pdf_content, _subtype='pdf')
        pdf_attachment.add_header(
            'Content-Disposition',
            'attachment',
            filename=f"{report.filename}_analysis.pdf"
        )
        msg.attach(pdf_attachment)
        
        # Send email
        try:
            with smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port']) as server:
                server.starttls()
                if self.smtp_config['username'] and self.smtp_config['password']:
                    server.login(self.smtp_config['username'], self.smtp_config['password'])
                server.send_message(msg)
            return True
        except Exception as e:
            raise Exception(f"SMTP error: {str(e)}")
    
    def _create_email_body(self, report: Report) -> str:
        """
        Create HTML email body with summary.
        
        Args:
            report: Report object
            
        Returns:
            HTML email body
        """
        # Count abnormal markers
        abnormal_count = sum(1 for m in report.markers if m.status != "normal")
        
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background: #3b82f6; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .summary {{ background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #64748b; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Medical Report Analysis</h1>
            </div>
            <div class="content">
                <h2>Report Summary</h2>
                <div class="summary">
                    <p><strong>Report:</strong> {report.filename}</p>
                    <p><strong>Date:</strong> {report.upload_date.strftime("%B %d, %Y")}</p>
                    <p><strong>Category:</strong> {report.category}</p>
                    <p><strong>Health Score:</strong> {report.health_score}/100</p>
                    <p><strong>Markers Analyzed:</strong> {len(report.markers)}</p>
                    <p><strong>Abnormal Markers:</strong> {abnormal_count}</p>
                    <p><strong>Deficiencies Detected:</strong> {len(report.deficiencies)}</p>
                </div>
                
                <p>Please find the detailed analysis attached as a PDF.</p>
                
                <p>If you have any concerns about your results, please consult with your healthcare provider.</p>
            </div>
            <div class="footer">
                <p>⚕ This analysis is AI-generated and not a substitute for professional medical advice.</p>
                <p>© 2024 Swasth AI - Your Health Companion</p>
            </div>
        </body>
        </html>
        """
        
        return html
