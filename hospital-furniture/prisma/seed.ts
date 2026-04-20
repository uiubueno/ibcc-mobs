import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Definimos a senha do seu Admin
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 2. Criamos o usuário (usamos upsert para não dar erro se rodar 2x)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ibcc.com.br' },
    update: {},
    create: {
      email: 'admin@ibcc.com.br',
      name: 'William Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log({ admin })
  console.log('✅ Usuário Admin criado com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })