import re


class CreditReportParser:
    def __init__(self, report_text):
        # Normalize line endings and remove extra whitespace
        self.report_text = "\n".join(
            line.strip() for line in report_text.splitlines() if line.strip()
        )

    def parse(self):
        """
        Parses the credit report text to extract categorized information.
        """
        parsed_data = {
            "inquiries": self._parse_inquiries(),
            "credit_report_messages": self._parse_credit_report_messages(),
            "chex_systems_data": self._parse_chex_systems_data(),
            "teletrack_data": self._parse_teletrack_data(),
            "fcra_summary_of_rights": self._parse_fcra_rights(),
            "fraud_victim_rights": self._parse_fraud_victim_rights(),
            "accounts": self._parse_accounts(),
        }
        return parsed_data

    def _parse_inquiries(self):
        inquiries = []
        # This pattern looks for "Requested On" and then captures everything until the next
        # "Requested On" or end of string.
        # It's designed to capture the entire block for each inquiry.
        inquiry_blocks = re.findall(
            r"Requested On\s*(.*?)(?=\nRequested On|\Z)", self.report_text, re.DOTALL
        )

        for block in inquiry_blocks:
            inquiry = {}
            # Extract Requested On date(s) - can be multiple, comma-separated
            requested_on_match = re.search(r"^(.*?)\s*Phone", block, re.DOTALL)
            if requested_on_match:
                inquiry["requested_on"] = [
                    d.strip() for d in requested_on_match.group(1).split(",")
                ]

            # Extract Phone
            phone_match = re.search(r"Phone\s*(.*?)\s*Location", block, re.DOTALL)
            if phone_match:
                inquiry["phone"] = phone_match.group(1).strip()

            # Extract Company Name (assuming it's between Phone and Location)
            company_match = re.search(
                r"(?<=Phone\s*[\s\S]*?)(.*?)(?=\s*Location)", block, re.DOTALL
            )
            if company_match:
                inquiry["company"] = company_match.group(1).strip()

            # Extract Location
            location_match = re.search(r"Location\s*(.*?)(?=\nRequested On|\Z)", block, re.DOTALL)
            if location_match:
                inquiry["location"] = location_match.group(1).strip()

            if inquiry:
                inquiries.append(inquiry)
        return inquiries

    def _parse_credit_report_messages(self):
        messages = {}
        # Security Alert
        security_alert_match = re.search(
            r"Security Alert\s*(.*?)(?=Security Freeze)", self.report_text, re.DOTALL
        )
        if security_alert_match:
            messages["security_alert"] = security_alert_match.group(1).strip()

        # Security Freeze
        security_freeze_match = re.search(
            r"Security Freeze\s*(.*?)(?=Promotional opt-out)", self.report_text, re.DOTALL
        )
        if security_freeze_match:
            messages["security_freeze"] = security_freeze_match.group(1).strip()

        # Promotional opt-out
        promotional_opt_out_match = re.search(
            r"Promotional opt-out\s*(.*?)(?=\n\n|\Z)", self.report_text, re.DOTALL
        )  # More general end
        if promotional_opt_out_match:
            messages["promotional_opt_out"] = promotional_opt_out_match.group(1).strip()
        return messages

    def _parse_chex_systems_data(self):
        chex_data = {}
        chex_section_match = re.search(
            r"Chex Systems Inc\.\s*\((.*?)\)\s*Requested by:\s*(.*?)\s*Requested on:\s*(.*?)"
            r"\s*Number of Accounts Consumer is Identified On:\s*(\d+)(.*?)(?=Teletrack)",
            self.report_text,
            re.DOTALL,
        )
        if chex_section_match:
            chex_data["contact_info"] = chex_section_match.group(1).strip()
            chex_data["requested_by"] = chex_section_match.group(2).strip()
            chex_data["requested_on"] = chex_section_match.group(3).strip()
            chex_data["num_accounts_identified_on"] = int(chex_section_match.group(4).strip())

            # Parse key-value pairs within the Chex Systems section
            details_text = chex_section_match.group(5)
            pattern = re.compile(
                r"([A-Za-z\s]+?):\s*([^\n]+(?:\n(?!\s*[A-Za-z]+:)[^\n]*)*)", re.MULTILINE
            )
            for match in pattern.finditer(details_text):
                key = match.group(1).strip().replace(" ", "_").lower()
                value = match.group(2).strip()
                if value.isdigit():
                    chex_data[key] = int(value)
                elif re.match(r"^$\\[\\d,. ]+$", value):
                    chex_data[key] = float(value.replace("$", "").replace(",", ""))
                else:
                    chex_data[key] = value
        return chex_data

    def _parse_teletrack_data(self):
        teletrack_data = {}
        teletrack_section_match = re.search(
            r"Teletrack\s*\((.*?)\)\s*Requested by:\s*(.*?)\s*Requested on:\s*(.*?)(.*?)"
            r"(?=Should you wish to contact TransUnion)",
            self.report_text,
            re.DOTALL,
        )
        if teletrack_section_match:
            teletrack_data["contact_info"] = teletrack_section_match.group(1).strip()
            teletrack_data["requested_by"] = teletrack_section_match.group(2).strip()
            teletrack_data["requested_on"] = teletrack_section_match.group(3).strip()

            details_text = teletrack_section_match.group(4)
            pattern = re.compile(
                r"([A-Za-z\s]+?):\s*([^\n]+(?:\n(?!\s*[A-Za-z]+:)[^\n]*)*)", re.MULTILINE
            )
            for match in pattern.finditer(details_text):
                key = match.group(1).strip().replace(" ", "_").lower()
                value = match.group(2).strip()
                if value.isdigit():
                    teletrack_data[key] = int(value)
                elif re.match(r"^$\\[\\d,. ]+$", value):
                    teletrack_data[key] = float(value.replace("$", "").replace(",", ""))
                else:
                    teletrack_data[key] = value
        return teletrack_data

    def _parse_fcra_rights(self):
        fcra_rights_match = re.search(
            r"SUMMARY OF RIGHTS\s*GENERAL SUMMARY OF RIGHTS UNDER THE FCRA\s*(.*?)"
            r"(?=FRAUD VICTIM RIGHTS)",
            self.report_text,
            re.DOTALL,
        )
        if fcra_rights_match:
            return fcra_rights_match.group(1).strip()
        return ""

    def _parse_fraud_victim_rights(self):
        fraud_victim_rights_match = re.search(
            r"FRAUD VICTIM RIGHTS\s*SUMMARY OF RIGHTS UNDER THE FCRA OF VICTIMS OF "
            r"IDENTITY THEFT\s*(.*?)(?=--- End of Extracted Text ---|\Z)",
            self.report_text,
            re.DOTALL,
        )
        if fraud_victim_rights_match:
            return fraud_victim_rights_match.group(1).strip()
        return ""

    def _parse_accounts(self):
        accounts = []
        account_sections = re.split(r"\n(?=[wgs +]?Account Number:)", self.report_text)

        for section in account_sections:
            if not section.strip():
                continue

            details = {
                "name": "Unknown",
                "number": "Unknown",
                "type": "Unknown",
                "status": "Unknown",
                "balance": "N/A",
                "credit_limit": "N/A",
                "payment_history": "N/A",
            }

            patterns = {
                "name": r"^(.*?)(?=Account Number:)",
                "number": r"Account Number:\s*([\w\d-]+)",
                "type": r"Account Type:\s*(.*?)(?=\n)",
                "status": r"Status:\s*(.*?)(?=\n)",
                "balance": r"Balance:\s*(\$[\d,.]+)",
                "credit_limit": r"Credit Limit:\s*(\$[\d,.]+)",
                "payment_history": r"Payment History:\s*(.*?)(?=\n)",
            }

            for key, pattern in patterns.items():
                match = re.search(pattern, section, re.IGNORECASE | re.MULTILINE)
                if match:
                    details[key] = match.group(1).strip()

            if details["name"] == "Unknown":
                fallback_name_match = re.search(r"^([\w\s]+)", section)
                if fallback_name_match:
                    details["name"] = fallback_name_match.group(1).strip()

            if details["name"] != "Unknown" and details["number"] != "Unknown":
                accounts.append(details)
        return accounts
