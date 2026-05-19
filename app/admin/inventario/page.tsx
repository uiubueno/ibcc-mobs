'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, CheckCircle, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

export default function InventarioGalpao() {
  const [name, setName] = useState('')
  const [patrimony, setPatrimony] = useState('')
  const [unit, setUnit] = useState('Não possui') 
  const [status, setStatus] = useState('BOM')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !name) return alert("A foto e o nome são obrigatórios!")
    
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const cloudData = await cloudRes.json()
      const imageUrl = cloudData.secure_url

      const dbRes = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, patrimony, unit, status, imageUrl })
      })

      if (!dbRes.ok) throw new Error("Erro ao salvar no banco")

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setName('')
        setPatrimony('')
        setUnit('Não possui')
        setStatus('BOM')
        setFile(null)
        setPreview(null)
      }, 2000)

    } catch (error) {
      console.error(error)
      alert("Ocorreu um erro ao salvar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-24 animate-in fade-in duration-500">
      
      {/* CABEÇALHO COM NAVEGAÇÃO RÁPIDA */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Inventário</h1>
        <Link 
          href="/admin/inventario/dashboard" 
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200/50 transition-all shadow-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          Ver Relatório
        </Link>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-2xl border-2 border-green-200 shadow-sm animate-in zoom-in-95">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <p className="text-lg font-black text-green-700 uppercase tracking-widest">Item Registrado!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ÁREA DA FOTO */}
          <div className="flex flex-col items-center gap-4">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            
            {preview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-64 md:h-72 rounded-2xl overflow-hidden border-4 border-slate-200 cursor-pointer shadow-md group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-bold text-sm tracking-widest uppercase">Tocar para trocar a foto</p>
                </div>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 md:h-56 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
              >
                <Camera className="w-12 h-12" />
                <span className="font-black uppercase tracking-widest text-sm">Tirar Foto do Mobiliário</span>
              </button>
            )}
          </div>

          {/* FORMULÁRIO DE DADOS */}
          <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">
                Mobiliário (Nome/Descrição) <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cama Hospitalar Elétrica"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm md:text-base font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">
                Patrimônio (Se houver)
              </label>
              <input 
                type="text" 
                value={patrimony}
                onChange={(e) => setPatrimony(e.target.value)}
                placeholder="Ex: 123456 (Deixe em branco se for S/P)"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm md:text-base font-medium"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">
                Unidade Pertencente
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Beneficência Camiliana', 'IBCC', 'Jaçanã', 'Não possui'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setUnit(op)}
                    className={`p-2.5 rounded-xl text-[10px] md:text-xs font-bold border-2 transition-all ${
                      unit === op 
                        ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">
                Status / Condição
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['BOM', 'CONSERTO', 'CONDENADO'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setStatus(op)}
                    className={`p-2.5 rounded-xl text-[10px] md:text-xs font-bold border-2 transition-all ${
                      status === op 
                        ? op === 'BOM' ? 'bg-green-100 border-green-500 text-green-700 shadow-sm'
                        : op === 'CONSERTO' ? 'bg-amber-100 border-amber-500 text-amber-700 shadow-sm'
                        : 'bg-red-100 border-red-500 text-red-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {op === 'BOM' ? 'Bom' : op === 'CONSERTO' ? 'Conserto' : 'Condenado'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !file}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm md:text-base mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando na Nuvem...
              </>
            ) : (
              'Salvar Item'
            )}
          </button>
        </form>
      )}
    </div>
  )
}