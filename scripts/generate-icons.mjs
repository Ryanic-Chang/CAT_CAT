import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const projectRoot = path.resolve(process.cwd())
const svgPath = path.join(projectRoot, 'public', 'icon.svg')
const outDir = path.join(projectRoot, 'public', 'icons')
const sizes = [16, 32, 48, 128]

async function main() {
  try {
    await fs.mkdir(outDir, { recursive: true })
    const svgBuffer = await fs.readFile(svgPath)

    await Promise.all(
      sizes.map(async (size) => {
        const out = path.join(outDir, `icon-${size}.png`)
        await sharp(svgBuffer)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(out)
        console.log(`Generated ${out}`)
      })
    )

    console.log('All icons generated successfully.')
  } catch (err) {
    console.error('Failed to generate icons:', err)
    process.exit(1)
  }
}

main()

