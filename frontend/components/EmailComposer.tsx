<<<<<<< HEAD
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmailComposer() {

  const router = useRouter();

  const [subject, setSubject] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [recipients, setRecipients] =
    useState<string[]>([]);

  useEffect(() => {

    const stored =
      sessionStorage.getItem(
        "ritnavRecipients"
      );

    if (!stored) {
      router.push("/upload");
      return;
    }

    setRecipients(
      JSON.parse(stored)
    );

  }, [router]);


  function continueToSend() {

    if (!subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    if (!message.trim()) {
      alert("Please enter a message.");
      return;
    }

    sessionStorage.setItem(
      "ritnavSubject",
      subject
    );

    sessionStorage.setItem(
      "ritnavMessage",
      message
    );

    router.push("/sending");
  }


  return (
    <div className="space-y-6">

      <div>

        <label className="font-medium">
          Subject
        </label>

        <input
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value)
          }
          placeholder="Enter email subject..."
          className="
            w-full
            mt-2
            border
            rounded-lg
            p-3
          "
        />

      </div>


      <div>

        <label className="font-medium">
          Message
        </label>

        <textarea
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Write your email..."
          rows={12}
          className="
            w-full
            mt-2
            border
            rounded-lg
            p-3
          "
        />

      </div>


      <div className="
        p-4
        rounded-lg
        bg-gray-100
      ">

        <strong>
          Recipients:
        </strong>

        <span className="ml-2">
          {recipients.length}
        </span>

      </div>


      <button
        onClick={continueToSend}
        className="
          w-full
          py-4
          rounded-lg
          bg-black
          text-white
          font-medium
        "
      >
        Continue to Send
      </button>

    </div>
  );
=======
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmailComposer() {

  const router = useRouter();

  const [subject, setSubject] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [recipients, setRecipients] =
    useState<string[]>([]);

  useEffect(() => {

    const stored =
      sessionStorage.getItem(
        "ritnavRecipients"
      );

    if (!stored) {
      router.push("/upload");
      return;
    }

    setRecipients(
      JSON.parse(stored)
    );

  }, [router]);


  function continueToSend() {

    if (!subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    if (!message.trim()) {
      alert("Please enter a message.");
      return;
    }

    sessionStorage.setItem(
      "ritnavSubject",
      subject
    );

    sessionStorage.setItem(
      "ritnavMessage",
      message
    );

    router.push("/sending");
  }


  return (
    <div className="space-y-6">

      <div>

        <label className="font-medium">
          Subject
        </label>

        <input
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value)
          }
          placeholder="Enter email subject..."
          className="
            w-full
            mt-2
            border
            rounded-lg
            p-3
          "
        />

      </div>


      <div>

        <label className="font-medium">
          Message
        </label>

        <textarea
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Write your email..."
          rows={12}
          className="
            w-full
            mt-2
            border
            rounded-lg
            p-3
          "
        />

      </div>


      <div className="
        p-4
        rounded-lg
        bg-gray-100
      ">

        <strong>
          Recipients:
        </strong>

        <span className="ml-2">
          {recipients.length}
        </span>

      </div>


      <button
        onClick={continueToSend}
        className="
          w-full
          py-4
          rounded-lg
          bg-black
          text-white
          font-medium
        "
      >
        Continue to Send
      </button>

    </div>
  );
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
}