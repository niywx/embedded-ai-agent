/**
 * @file ocr.js
 * @brief OCR 功能模块
 * @description 提供 PDF 和图片的文本提取功能
 */

import fs from 'fs-extra';
import pdfParse from 'pdf-parse';
import tesseract from 'node-tesseract-ocr';
import { PNG } from 'pngjs';

// ============================================================================
// PDF 处理
// ============================================================================

/**
 * 从 PDF 文件提取文本
 * @param {string} pdfPath - PDF 文件路径
 * @returns {Promise<string>} 提取的文本内容
 */
export async function extractTextFromPDF(pdfPath) {
    try {
        console.log(`[OCR] Extracting text from PDF: ${pdfPath}`);
        
        const dataBuffer = await fs.readFile(pdfPath);
        const data = await pdfParse(dataBuffer);
        
        console.log(`[OCR] Extracted ${data.text.length} characters from PDF`);
        return data.text;
        
    } catch (error) {
        console.error(`[OCR] Error extracting text from PDF:`, error.message);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

/**
 * 从 PDF 文件提取第一页作为图片
 * @param {string} pdfPath - PDF 文件路径
 * @returns {Promise<Buffer>} PNG 格式的图片 Buffer
 * @note 这是简化实现，实际项目中可使用 pdf2pic 或 pdf-to-png 库
 */
export async function extractImageFromPDF(pdfPath) {
    try {
        console.log(`[OCR] Extracting image from PDF: ${pdfPath}`);
        
        // 注意：这里是简化实现
        // 实际使用中建议安装 pdf2pic 库来转换 PDF 为图片
        // 这里我们创建一个占位图片
        console.warn(`[OCR] Warning: PDF to image conversion is simplified. Consider using pdf2pic for production.`);
        
        // 创建一个简单的占位 PNG
        const png = new PNG({ width: 800, height: 600 });
        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                const idx = (png.width * y + x) << 2;
                png.data[idx] = 255;     // R
                png.data[idx + 1] = 255; // G
                png.data[idx + 2] = 255; // B
                png.data[idx + 3] = 255; // A
            }
        }
        
        const buffer = PNG.sync.write(png);
        console.log(`[OCR] Created placeholder image (${buffer.length} bytes)`);
        return buffer;
        
    } catch (error) {
        console.error(`[OCR] Error extracting image from PDF:`, error.message);
        throw new Error(`Failed to extract image from PDF: ${error.message}`);
    }
}

// ============================================================================
// 图片处理
// ============================================================================

/**
 * 从图片文件提取文本（OCR）
 * @param {string} imagePath - 图片文件路径
 * @returns {Promise<string>} OCR 识别的文本
 */
export async function extractTextFromImage(imagePath) {
    try {
        console.log(`[OCR] Running OCR on image: ${imagePath}`);
        
        const config = {
            lang: 'eng',  // 语言：英文
            oem: 1,       // OCR Engine Mode
            psm: 3,       // Page Segmentation Mode
        };
        
        const text = await tesseract.recognize(imagePath, config);
        
        console.log(`[OCR] OCR completed, extracted ${text.length} characters`);
        return text;
        
    } catch (error) {
        console.error(`[OCR] Error during OCR:`, error.message);
        console.warn(`[OCR] Note: Tesseract must be installed on your system`);
        console.warn(`[OCR] Install: https://github.com/tesseract-ocr/tesseract`);
        
        // 如果 OCR 失败，返回空字符串而不是抛出错误
        return '';
    }
}

/**
 * 读取图片文件为 Buffer
 * @param {string} imagePath - 图片文件路径
 * @returns {Promise<Buffer>} 图片 Buffer
 */
export async function readImageAsBuffer(imagePath) {
    try {
        console.log(`[OCR] Reading image: ${imagePath}`);
        
        const buffer = await fs.readFile(imagePath);
        
        console.log(`[OCR] Image loaded (${buffer.length} bytes)`);
        return buffer;
        
    } catch (error) {
        console.error(`[OCR] Error reading image:`, error.message);
        throw new Error(`Failed to read image: ${error.message}`);
    }
}

/**
 * 判断文件是否为 PDF
 * @param {string} filePath - 文件路径
 * @returns {boolean}
 */
export function isPDF(filePath) {
    return filePath.toLowerCase().endsWith('.pdf');
}

/**
 * 判断文件是否为图片
 * @param {string} filePath - 文件路径
 * @returns {boolean}
 */
export function isImage(filePath) {
    const ext = filePath.toLowerCase();
    return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.bmp');
}

/**
 * 判断文件是否为文本
 * @param {string} filePath - 文件路径
 * @returns {boolean}
 */
export function isText(filePath) {
    const ext = filePath.toLowerCase();
    return ext.endsWith('.txt') || ext.endsWith('.md');
}

// ============================================================================
// 通用文档处理
// ============================================================================

/**
 * 自动检测文件类型并提取文本
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 提取的文本
 */
export async function extractText(filePath) {
    console.log(`[OCR] Auto-detecting file type: ${filePath}`);
    
    if (isText(filePath)) {
        console.log(`[OCR] Detected as text file`);
        return await fs.readFile(filePath, 'utf-8');
    } else if (isPDF(filePath)) {
        console.log(`[OCR] Detected as PDF file`);
        return await extractTextFromPDF(filePath);
    } else if (isImage(filePath)) {
        console.log(`[OCR] Detected as image file`);
        return await extractTextFromImage(filePath);
    } else {
        throw new Error(`Unsupported file type: ${filePath}`);
    }
}

/**
 * 提取文档作为图片（用于视觉模型）
 * @param {string} filePath - 文件路径
 * @returns {Promise<Buffer>} 图片 Buffer
 */
export async function extractAsImage(filePath) {
    console.log(`[OCR] Extracting as image: ${filePath}`);
    
    if (isImage(filePath)) {
        return await readImageAsBuffer(filePath);
    } else if (isPDF(filePath)) {
        return await extractImageFromPDF(filePath);
    } else {
        throw new Error(`Cannot convert ${filePath} to image`);
    }
}

// ============================================================================
// 导出
// ============================================================================

export default {
    extractTextFromPDF,
    extractImageFromPDF,
    extractTextFromImage,
    readImageAsBuffer,
    extractText,
    extractAsImage,
    isPDF,
    isImage,
    isText
};
