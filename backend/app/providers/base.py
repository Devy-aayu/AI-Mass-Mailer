<<<<<<< HEAD
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
=======
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
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
        raise NotImplementedError