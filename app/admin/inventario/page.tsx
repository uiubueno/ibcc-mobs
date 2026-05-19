'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, CheckCircle } from 'lucide-react'

export default function InventarioGalpao() {
  const [name, setName] = useState('')
  const [patrimony, setPatrimony] = useState('')
  const [unit, setUnit] = useState('Não possui') // ✅ ESTADO DA UNIDADE
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

      // ✅ ENVIANDO O UNIT PARA A API
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
    <div className="max-w-md mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventário do Galpão</h1>

      {success ? (
        <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <p className="text-lg font-semibold text-green-700">Item Registrado!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
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
                className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white font-bold">Tocar para trocar a foto</p>
                </div>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Camera className="w-10 h-10" />
                <span className="font-semibold">Tirar Foto do Mobiliário</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobiliário (Nome/Descrição) *</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cama Hospitalar Elétrica"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patrimônio (Se houver)</label>
              <input 
                type="text" 
                value={patrimony}
                onChange={(e) => setPatrimony(e.target.value)}
                placeholder="Ex: 123456 (Deixe em branco se for S/P)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* ✅ BLOCO NOVO: UNIDADE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidade Pertencente</label>
              <div className="grid grid-cols-2 gap-2">
                {['Beneficência Camiliana', 'IBCC', 'Jaçanã', 'Não possui'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setUnit(op)}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all ${
                      unit === op 
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status / Condição</label>
              <div className="grid grid-cols-3 gap-2">
                {['BOM', 'CONSERTO', 'CONDENADO'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setStatus(op)}
                    className={`p-2 rounded-lg text-sm font-semibold border transition-all ${
                      status === op 
                        ? op === 'BOM' ? 'bg-green-100 border-green-500 text-green-700'
                        : op === 'CONSERTO' ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                        : 'bg-red-100 border-red-500 text-red-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
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
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
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