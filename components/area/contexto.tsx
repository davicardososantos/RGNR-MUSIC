'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { EventoArea } from './tipos'

type Contexto = {
  hoje: string
  eventos: EventoArea[]
  evento: (id: string) => EventoArea | undefined
}

const AreaContexto = createContext<Contexto | null>(null)

/** O "hoje" do servidor e a lista de datas, para qualquer tela da área. */
export function ProvedorArea({
  hoje,
  eventos,
  children,
}: {
  hoje: string
  eventos: EventoArea[]
  children: ReactNode
}) {
  const porId = new Map(eventos.map((e) => [e.id, e]))
  return (
    <AreaContexto.Provider value={{ hoje, eventos, evento: (id) => porId.get(id) }}>
      {children}
    </AreaContexto.Provider>
  )
}

export function useArea() {
  const c = useContext(AreaContexto)
  if (!c) throw new Error('useArea fora do ProvedorArea')
  return c
}
