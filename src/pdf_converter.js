/**
 * @file pdf_converter.js
 * @brief PDF 自动转换模块
 * @description 自动将 PDF 原理图转换为图片格式，以便视觉模型识别
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 检查 ImageMagick 是否已安装
 * @returns {Promise<boolean>}
 */
async function checkImageMagick() {
    try {
        await execPromise('magick --version');
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 检查 Ghostscript 是否已安装
 * @returns {Promise<boolean>}
 */
async function checkGhostscript() {
    try {
        await execPromise('gswin64c -version');
        return true;
    } catch (error) {
        try {
            await execPromise('gs -version');
            return true;
        } catch (err) {
            return false;
        }
    }
}

/**
 * 使用 ImageMagick 转换 PDF 为 PNG
 * @param {string} pdfPath - PDF 文件路径
 * @param {string} outputPath - 输出 PNG 路径
 * @param {number} dpi - 分辨率（默认 300）
 * @returns {Promise<string>} 转换后的图片路径
 */
async function convertWithImageMagick(pdfPath, outputPath, dpi = 300) {
    const startTime = Date.now();
    console.log(`\n[PDF Converter] 🔧 Using ImageMagick for conversion`);
    console.log(`[PDF Converter] ⏰ Start time: ${new Date().toISOString()}`);
    
    try {
        const fileStats = await fs.stat(pdfPath);
        console.log(`[PDF Converter] 📊 Input file info:`);
        console.log(`[PDF Converter]   • Size: ${(fileStats.size / 1024).toFixed(2)} KB`);
        console.log(`[PDF Converter]   • Path: ${pdfPath}`);
        console.log(`[PDF Converter] 🎨 Conversion settings:`);
        console.log(`[PDF Converter]   • DPI: ${dpi}`);
        console.log(`[PDF Converter]   • Output: ${outputPath}`);
        
        const cmd = `magick convert -density ${dpi} "${pdfPath}" "${outputPath}"`;
        console.log(`[PDF Converter] 🚀 Executing command: ${cmd.substring(0, 80)}...`);
        
        const execStart = Date.now();
        await execPromise(cmd, { maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer
        const execElapsed = Date.now() - execStart;
        
        console.log(`[PDF Converter]   ✓ Command completed in ${execElapsed}ms (${(execElapsed/1000).toFixed(2)}s)`);
        
        // 检查是否生成了多页（-0.png, -1.png 等）
        const dir = path.dirname(outputPath);
        const basename = path.basename(outputPath, '.png');
        const files = await fs.readdir(dir);
        const multiPageFiles = files.filter(f => f.startsWith(basename + '-'));
        
        let finalPath = outputPath;
        if (multiPageFiles.length > 0) {
            // 多页 PDF，返回第一页
            finalPath = path.join(dir, multiPageFiles[0]);
            console.log(`[PDF Converter] 📄 Multi-page PDF detected:`);
            console.log(`[PDF Converter]   • Total pages: ${multiPageFiles.length}`);
            console.log(`[PDF Converter]   • Using first page: ${multiPageFiles[0]}`);
        }
        
        const outputStats = await fs.stat(finalPath);
        const totalElapsed = Date.now() - startTime;
        
        console.log(`[PDF Converter] ✅ Conversion successful!`);
        console.log(`[PDF Converter] 📊 Output file info:`);
        console.log(`[PDF Converter]   • Size: ${(outputStats.size / 1024).toFixed(2)} KB`);
        console.log(`[PDF Converter]   • Path: ${finalPath}`);
        console.log(`[PDF Converter]   • Compression ratio: ${((fileStats.size / outputStats.size) * 100).toFixed(1)}%`);
        console.log(`[PDF Converter] ⏱️  Total conversion time: ${totalElapsed}ms (${(totalElapsed/1000).toFixed(2)}s)\n`);
        
        return finalPath;
    } catch (error) {
        const totalElapsed = Date.now() - startTime;
        console.error(`[PDF Converter] ❌ ImageMagick conversion failed after ${totalElapsed}ms`);
        console.error(`[PDF Converter]   • Error: ${error.message}`);
        throw new Error(`ImageMagick conversion failed: ${error.message}`);
    }
}

/**
 * 使用 Ghostscript 转换 PDF 为 PNG
 * @param {string} pdfPath - PDF 文件路径
 * @param {string} outputPath - 输出 PNG 路径
 * @param {number} dpi - 分辨率（默认 300）
 * @returns {Promise<string>} 转换后的图片路径
 */
async function convertWithGhostscript(pdfPath, outputPath, dpi = 300) {
    const startTime = Date.now();
    console.log(`\n[PDF Converter] 👻 Using Ghostscript for conversion`);
    console.log(`[PDF Converter] ⏰ Start time: ${new Date().toISOString()}`);
    
    try {
        const fileStats = await fs.stat(pdfPath);
        console.log(`[PDF Converter] 📊 Input file info:`);
        console.log(`[PDF Converter]   • Size: ${(fileStats.size / 1024).toFixed(2)} KB`);
        console.log(`[PDF Converter]   • Path: ${pdfPath}`);
        console.log(`[PDF Converter] 🎨 Conversion settings:`);
        console.log(`[PDF Converter]   • DPI: ${dpi}`);
        console.log(`[PDF Converter]   • Device: png16m (24-bit color)`);
        console.log(`[PDF Converter]   • Pages: First page only`);
        console.log(`[PDF Converter]   • Output: ${outputPath}`);
        
        // Ghostscript 命令
        const gsCmd = process.platform === 'win32' ? 'gswin64c' : 'gs';
        const cmd = `${gsCmd} -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r${dpi} -dFirstPage=1 -dLastPage=1 -sOutputFile="${outputPath}" "${pdfPath}"`;
        console.log(`[PDF Converter] 🚀 Executing command: ${cmd.substring(0, 80)}...`);
        
        const execStart = Date.now();
        await execPromise(cmd, { maxBuffer: 50 * 1024 * 1024 });
        const execElapsed = Date.now() - execStart;
        
        console.log(`[PDF Converter]   ✓ Command completed in ${execElapsed}ms (${(execElapsed/1000).toFixed(2)}s)`);
        
        const outputStats = await fs.stat(outputPath);
        const totalElapsed = Date.now() - startTime;
        
        console.log(`[PDF Converter] ✅ Conversion successful!`);
        console.log(`[PDF Converter] 📊 Output file info:`);
        console.log(`[PDF Converter]   • Size: ${(outputStats.size / 1024).toFixed(2)} KB`);
        console.log(`[PDF Converter]   • Path: ${outputPath}`);
        console.log(`[PDF Converter]   • Compression ratio: ${((fileStats.size / outputStats.size) * 100).toFixed(1)}%`);
        console.log(`[PDF Converter] ⏱️  Total conversion time: ${totalElapsed}ms (${(totalElapsed/1000).toFixed(2)}s)\n`);
        
        return outputPath;
    } catch (error) {
        const totalElapsed = Date.now() - startTime;
        console.error(`[PDF Converter] ❌ Ghostscript conversion failed after ${totalElapsed}ms`);
        console.error(`[PDF Converter]   • Error: ${error.message}`);
        throw new Error(`Ghostscript conversion failed: ${error.message}`);
    }
}

/**
 * 自动转换 PDF 为 PNG（尝试多种方法）
 * @param {string} pdfPath - PDF 文件路径
 * @param {Object} options - 选项
 * @param {number} options.dpi - 分辨率（默认 300）
 * @param {string} options.outputDir - 输出目录（默认 temp）
 * @returns {Promise<string>} 转换后的图片路径
 */
export async function convertPdfToImage(pdfPath, options = {}) {
    const { dpi = 300, outputDir = null } = options;
    
    // 检查 PDF 文件是否存在
    if (!await fs.pathExists(pdfPath)) {
        throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    // 确定输出路径
    const tempDir = outputDir || path.join(__dirname, '..', 'temp');
    await fs.ensureDir(tempDir);
    
    const basename = path.basename(pdfPath, '.pdf');
    const timestamp = Date.now();
    const outputPath = path.join(tempDir, `${basename}_${timestamp}.png`);
    
    console.log(`\n========================================`);
    console.log(`PDF to Image Conversion`);
    console.log(`========================================`);
    console.log(`Input: ${pdfPath}`);
    console.log(`Output: ${outputPath}`);
    console.log(`DPI: ${dpi}\n`);
    
    // 尝试 ImageMagick
    const hasImageMagick = await checkImageMagick();
    if (hasImageMagick) {
        try {
            return await convertWithImageMagick(pdfPath, outputPath, dpi);
        } catch (error) {
            console.warn(`[PDF Converter] ImageMagick failed: ${error.message}`);
            console.log(`[PDF Converter] Trying alternative method...`);
        }
    } else {
        console.log(`[PDF Converter] ImageMagick not found, trying Ghostscript...`);
    }
    
    // 尝试 Ghostscript
    const hasGhostscript = await checkGhostscript();
    if (hasGhostscript) {
        try {
            return await convertWithGhostscript(pdfPath, outputPath, dpi);
        } catch (error) {
            console.warn(`[PDF Converter] Ghostscript failed: ${error.message}`);
        }
    } else {
        console.log(`[PDF Converter] Ghostscript not found.`);
    }
    
    // 所有方法都失败
    throw new Error(
        `Cannot convert PDF to image. Please install one of the following tools:\n` +
        `1. ImageMagick: https://imagemagick.org/script/download.php\n` +
        `2. Ghostscript: https://www.ghostscript.com/download/gsdnld.html\n\n` +
        `Or manually convert the PDF to PNG using an online tool:\n` +
        `- https://www.ilovepdf.com/pdf_to_jpg\n` +
        `- https://smallpdf.com/pdf-to-jpg`
    );
}

/**
 * 检查系统中可用的转换工具
 * @returns {Promise<Object>} 可用工具信息
 */
export async function checkAvailableTools() {
    const hasImageMagick = await checkImageMagick();
    const hasGhostscript = await checkGhostscript();
    
    return {
        imageMagick: hasImageMagick,
        ghostscript: hasGhostscript,
        canConvert: hasImageMagick || hasGhostscript
    };
}

/**
 * 获取安装指南
 * @returns {string} 安装说明
 */
export function getInstallationGuide() {
    return `
PDF 转图片工具安装指南：

方法 1: 安装 ImageMagick（推荐）
------------------------------------
Windows:
  1. 访问 https://imagemagick.org/script/download.php#windows
  2. 下载 ImageMagick-*-Q16-HDRI-x64-dll.exe
  3. 安装时勾选 "Install legacy utilities (e.g. convert)"
  4. 重启终端，运行 'magick --version' 验证安装

Linux:
  sudo apt-get install imagemagick

macOS:
  brew install imagemagick

方法 2: 安装 Ghostscript
------------------------------------
Windows:
  1. 访问 https://www.ghostscript.com/download/gsdnld.html
  2. 下载 Ghostscript AGPL Release for Windows (64 bit)
  3. 安装后重启终端

Linux:
  sudo apt-get install ghostscript

macOS:
  brew install ghostscript

验证安装：
------------------------------------
magick --version  （ImageMagick）
gswin64c -version （Windows Ghostscript）
gs -version       （Linux/Mac Ghostscript）
`;
}
