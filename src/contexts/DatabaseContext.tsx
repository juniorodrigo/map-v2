"use client"

import React from "react"
import { usePathname } from "next/navigation"

type DatabaseName = "gu" | "gga"

interface DatabaseContextType {
  database: DatabaseName
}

const DatabaseContext = React.createContext<DatabaseContextType | null>(null)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/gu"

  // Determinar la base de datos según la ruta
  const database = React.useMemo<DatabaseName>(() => {
    if (pathname.startsWith("/marketmeet")) {
      return "gga"
    }
    // Default es /gu
    return "gu"
  }, [pathname])

  const value = React.useMemo(
    () => ({
      database,
    }),
    [database]
  )

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>
}

export function useDatabase() {
  const context = React.useContext(DatabaseContext)
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider")
  }
  return context
}
