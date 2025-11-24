"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { firebaseClient } from "@/service/firebase/client"
import { getDoc } from "firebase/firestore"
import { whatsappService } from "@/service/whatsapp/templates"
import { MdWhatsapp } from "react-icons/md"

type ContactAgentButtonProps = {
  propertyId: string
  userOwnerId?: string
  ownerPhone?: string
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export default function ContactAgentButton({
  propertyId,
  userOwnerId,
  ownerPhone,
  onClick,
  className,
  style,
  children,
}: ContactAgentButtonProps) {
  const [ownerNumber, setOwnerNumber] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchOwner = async () => {
      try {
        if (ownerPhone) {
          if (mounted) setOwnerNumber(ownerPhone)
          return
        }

        if (userOwnerId) {
          const ref = firebaseClient.getUserRef(userOwnerId)
          const snap = await getDoc(ref)
          const data = snap.data() as { phone_number?: string } | undefined
          if (mounted && data?.phone_number) setOwnerNumber(data.phone_number)
        }
      } catch (error) {

      }
    }

    fetchOwner()

    return () => {
      mounted = false
    }
  }, [userOwnerId, ownerPhone])

  const handleClick = () => {
    onClick?.()
    if (!ownerNumber) return
    try {
      whatsappService.openWhatsAppChat(ownerNumber, propertyId)
    } catch (error) {

    }
  }

  return (
    <Button
      onClick={handleClick}
      className={className ?? "w-full h-11 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"}
      style={style}
      disabled={!ownerNumber}
    >
      {children ?? (
        <>
          <MdWhatsapp className="size-4" />
          Contactar Agente
        </>
      )}
    </Button>
  )
}
