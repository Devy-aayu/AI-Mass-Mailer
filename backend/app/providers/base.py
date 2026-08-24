from __future__ import annotations

from abc import ABC, abstractmethod


class MailProvider(
    ABC
):

    provider_name: str = ""


    @abstractmethod
    def send(
        self,
        *,
        account: dict,
        recipient: str,
        subject: str,
        body: str,
    ) -> dict:
        raise NotImplementedError