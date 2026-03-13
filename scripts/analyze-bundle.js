/**
 * Bundle 分析脚本
 * 
 * 使用方法:
 * node scripts/analyze-bundle.js
 * 
 * 功能:
 * - 分析 Next.js 构建输出
 * - 识别大体积 chunk
 * - 提供优化建议
 */

const fs = require('fs')
const path = require('path')

const BUILD_DIR = path.join(__dirname, '..', '.next')
const STATIC_DIR = path.join(BUILD_DIR, 'static')

// 文件大小格式化
function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件大小
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath)
    return stats.size
  } catch {
    return 0
  }
}

// 递归获取目录中所有文件
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath)

  files.forEach(file => {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles)
    } else {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

// 分析 chunks
function analyzeChunks() {
  const chunksDir = path.join(STATIC_DIR, 'chunks')
  if (!fs.existsSync(chunksDir)) {
    console.log('❌ 未找到 chunks 目录，请先运行构建')
    return
  }

  const files = getAllFiles(chunksDir)
  const chunks = files
    .filter(f => f.endsWith('.js'))
    .map(f => ({
      name: path.basename(f),
      path: f,
      size: getFileSize(f)
    }))
    .sort((a, b) => b.size - a.size)

  console.log('\n📦 Chunk 分析')
  console.log('=' .repeat(60))
  
  let totalSize = 0
  const largeChunks = []
  const mediumChunks = []
  const smallChunks = []

  chunks.forEach(chunk => {
    totalSize += chunk.size
    
    if (chunk.size > 100 * 1024) {
      largeChunks.push(chunk)
    } else if (chunk.size > 50 * 1024) {
      mediumChunks.push(chunk)
    } else {
      smallChunks.push(chunk)
    }
  })

  // 显示大 chunk
  if (largeChunks.length > 0) {
    console.log('\n🔴 大 Chunk (>100KB):')
    largeChunks.forEach(chunk => {
      console.log(`  ${chunk.name}: ${formatSize(chunk.size)}`)
    })
  }

  // 显示中等 chunk
  if (mediumChunks.length > 0) {
    console.log('\n🟡 中等 Chunk (50-100KB):')
    mediumChunks.forEach(chunk => {
      console.log(`  ${chunk.name}: ${formatSize(chunk.size)}`)
    })
  }

  // 显示统计
  console.log('\n📊 统计信息')
  console.log('-'.repeat(60))
  console.log(`总 Chunk 数: ${chunks.length}`)
  console.log(`总大小: ${formatSize(totalSize)}`)
  console.log(`大 Chunk 数: ${largeChunks.length}`)
  console.log(`中等 Chunk 数: ${mediumChunks.length}`)
  console.log(`小 Chunk 数: ${smallChunks.length}`)

  return { chunks, totalSize, largeChunks }
}

// 分析页面
function analyzePages() {
  const serverDir = path.join(BUILD_DIR, 'server')
  if (!fs.existsSync(serverDir)) {
    console.log('\n❌ 未找到 server 目录')
    return
  }

  const pagesDir = path.join(serverDir, 'app')
  if (!fs.existsSync(pagesDir)) {
    console.log('\n❌ 未找到 app 目录')
    return
  }

  const files = getAllFiles(pagesDir)
  const pages = files
    .filter(f => f.endsWith('.js') && !f.includes('node_modules'))
    .map(f => ({
      name: path.relative(pagesDir, f).replace(/\\/g, '/'),
      path: f,
      size: getFileSize(f)
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 20) // 只显示前20个

  console.log('\n\n📄 页面分析 (Top 20)')
  console.log('=' .repeat(60))
  
  pages.forEach(page => {
    const size = formatSize(page.size)
    const icon = page.size > 100 * 1024 ? '🔴' : page.size > 50 * 1024 ? '🟡' : '🟢'
    console.log(`${icon} ${page.name}: ${size}`)
  })

  return pages
}

// 分析依赖
function analyzeDependencies() {
  const packageJson = require('../package.json')
  const deps = Object.keys(packageJson.dependencies || {})
  const devDeps = Object.keys(packageJson.devDependencies || {})

  console.log('\n\n📚 依赖分析')
  console.log('=' .repeat(60))
  console.log(`生产依赖: ${deps.length} 个`)
  console.log(`开发依赖: ${devDeps.length} 个`)

  // 常见大体积依赖
  const largeDeps = [
    'framer-motion',
    'lodash',
    'moment',
    '@mui/material',
    'antd',
    'chart.js',
    'three',
    'fabric',
    'pdf-lib',
    'xlsx'
  ]

  const foundLargeDeps = deps.filter(dep => 
    largeDeps.some(large => dep.toLowerCase().includes(large.toLowerCase()))
  )

  if (foundLargeDeps.length > 0) {
    console.log('\n⚠️  可能的大体积依赖:')
    foundLargeDeps.forEach(dep => {
      console.log(`  - ${dep}`)
    })
  }

  return { deps, devDeps, foundLargeDeps }
}

// 生成优化建议
function generateRecommendations(analysis) {
  console.log('\n\n💡 优化建议')
  console.log('=' .repeat(60))

  const recommendations = []

  // 检查大 chunk
  if (analysis.chunks.largeChunks.length > 0) {
    recommendations.push({
      priority: 'high',
      title: '大 Chunk 优化',
      description: `发现 ${analysis.chunks.largeChunks.length} 个超过 100KB 的 chunk，建议进行代码分割或懒加载。`
    })
  }

  // 检查总大小
  if (analysis.chunks.totalSize > 500 * 1024) {
    recommendations.push({
      priority: 'medium',
      title: '总 Bundle 大小',
      description: `总 chunk 大小为 ${formatSize(analysis.chunks.totalSize)}，建议控制在 500KB 以下。`
    })
  }

  // 检查大依赖
  if (analysis.dependencies.foundLargeDeps.length > 0) {
    recommendations.push({
      priority: 'medium',
      title: '依赖优化',
      description: `发现 ${analysis.dependencies.foundLargeDeps.length} 个可能的大体积依赖，考虑使用按需加载或替代方案。`
    })
  }

  // 通用建议
  recommendations.push(
    {
      priority: 'low',
      title: 'Tree Shaking',
      description: '确保所有依赖都支持 Tree Shaking，移除未使用的代码。'
    },
    {
      priority: 'low',
      title: '图片优化',
      description: '使用 WebP 格式，并考虑使用 CDN 或对象存储服务。'
    },
    {
      priority: 'low',
      title: '动态导入',
      description: '对非关键组件使用动态导入 (dynamic import) 进行代码分割。'
    }
  )

  // 按优先级显示
  const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' }
  
  recommendations.forEach(rec => {
    console.log(`\n${priorityEmoji[rec.priority]} ${rec.title}`)
    console.log(`   ${rec.description}`)
  })

  return recommendations
}

// 主函数
async function main() {
  console.log('🔍 Next.js Bundle 分析器')
  console.log('=' .repeat(60))

  if (!fs.existsSync(BUILD_DIR)) {
    console.log('\n❌ 未找到构建目录，请先运行: pnpm build')
    process.exit(1)
  }

  const analysis = {
    chunks: analyzeChunks(),
    pages: analyzePages(),
    dependencies: analyzeDependencies()
  }

  generateRecommendations(analysis)

  // 保存分析报告
  const reportPath = path.join(BUILD_DIR, 'bundle-analysis.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalChunkSize: analysis.chunks?.totalSize || 0,
      totalChunks: analysis.chunks?.chunks?.length || 0,
      largeChunks: analysis.chunks?.largeChunks?.length || 0
    },
    chunks: analysis.chunks?.chunks?.map(c => ({
      name: c.name,
      size: c.size,
      sizeFormatted: formatSize(c.size)
    })),
    pages: analysis.pages?.map(p => ({
      name: p.name,
      size: p.size,
      sizeFormatted: formatSize(p.size)
    }))
  }, null, 2))

  console.log(`\n✅ 分析报告已保存到: ${reportPath}`)
}

main().catch(console.error)
