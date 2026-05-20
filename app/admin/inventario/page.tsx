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

  // ✅ MOTOR DE COMPRESSÃO MELHORADO PARA MOBILE
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      // createObjectURL é muito mais seguro para arquivos grandes do que FileReader
      const objectUrl = URL.createObjectURL(file)
      img.src = objectUrl

      img.onload = () => {
        URL.revokeObjectURL(objectUrl) // Libera a memória do celular
        
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const MAX_WIDTH = 1200 
        
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width)
          width = MAX_WIDTH
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], "foto_inventario.jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(newFile)
          } else {
            reject(new Error("Falha ao processar a imagem no Canvas"))
          }
        }, 'image/jpeg', 0.8)
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error("O navegador não conseguiu ler o formato da foto (Possível bloqueio de HEIC)."))
      }
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setPreview(URL.createObjectURL(selectedFile))
      
      try {
        const compressedFile = await compressImage(selectedFile)
        setFile(compressedFile)
      } catch (err: any) {
        console.error("Erro na compressão:", err)
        // Se falhar a compressão, avisa o usuário em vez de tentar mandar 15MB pra nuvem
        alert(`Aviso: ${err.message || 'Falha ao comprimir imagem'}. Tente mudar a câmera para salvar em JPG.`)
        setFile(selectedFile) 
      }
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
      
      // ✅ ALERTA DE ERRO MELHORADO: Agora mostra o motivo exato se o Cloudinary recusar
      if (!cloudRes.ok) {
        throw new Error(`Erro Nuvem: ${cloudData.error?.message || 'Falha no upload'}`)
      }
      
      const imageUrl = cloudData.secure_url

      const dbRes = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, patrimony, unit, status, imageUrl })
      })

      const dbData = await dbRes.json()

      if (!dbRes.ok) {
        throw new Error(`Erro Banco: ${dbData.error || 'Falha ao salvar'}`)
      }

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

    } catch (error: any) {
      console.error("ERRO COMPLETO:", error)
      // ✅ Mostra a mensagem real do erro na tela do celular
      alert(`Ocorreu um erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-24 animate-in fade-in duration-500">
      
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
          
          <div className="flex flex-col items-center gap-4">
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
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
                placeholder="Ex: 123456 (Opcional)"
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
              <p className="text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-6 md:mt-8 pb-4">
          IBCC ONCOLOGIA • HOTELARIA
        </p>
    </div>
  )
}