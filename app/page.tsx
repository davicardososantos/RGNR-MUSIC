import { redirect } from 'next/navigation'
import { MES_OFICIAL } from '@/lib/datas'

export default function Home() {
  redirect(`/${MES_OFICIAL.slug}`)
}
