"""Utility adapters for route helpers.

This module provides a small compatibility layer expected by routes that
previously imported helpers from various places. It delegates to the
implementation in modules.routes.endorsement to avoid duplicating logic.
"""

from typing import Any, Dict

try:
    # endorsement module contains the real implementations
    from modules.routes.endorsement import (
        get_bill_data_from_source as _get_bill_data_from_source,
    )
    from modules.routes.endorsement import load_yaml_config as _load_yaml_config
    from modules.routes.endorsement import (
        prepare_endorsement_for_signing as _prepare_endorsement_for_signing,
    )
except Exception:
    # If endorsement isn't importable (tests mocking), provide fallbacks
    def _load_yaml_config(path: str) -> Dict[str, Any]:
        return {"error": f"Config loader unavailable for {path}"}

    def _get_bill_data_from_source(file_storage) -> Dict[str, Any]:
        return {"error": "Bill parser unavailable"}

    def _prepare_endorsement_for_signing(bill_data: dict, endorsement_text: str) -> Dict[str, Any]:
        return {
            "document_type": bill_data.get("document_type", "Unknown"),
            "bill_number": bill_data.get("bill_number", "N/A"),
            "customer_name": bill_data.get("customer_name", "N/A"),
            "total_amount": bill_data.get("total_amount", "N/A"),
            "currency": bill_data.get("currency", "N/A"),
            "endorsement_date": "",
            "endorser_id": "WEB-UTIL-001",
            "endorsement_text": endorsement_text,
        }


def load_yaml_config(path: str) -> Dict[str, Any]:
    return _load_yaml_config(path)


def get_bill_data_from_source(file_storage) -> Dict[str, Any]:
    return _get_bill_data_from_source(file_storage)


def prepare_endorsement_for_signing(bill_data: dict, endorsement_text: str) -> Dict[str, Any]:
    return _prepare_endorsement_for_signing(bill_data, endorsement_text)
