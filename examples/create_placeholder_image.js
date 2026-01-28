/**
 * @file create_placeholder_image.js
 * @brief 创建占位图片
 */

import fs from 'fs';
import { PNG } from 'pngjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 800x600 的浅蓝色图片
const png = new PNG({
    width: 800,
    height: 600,
    colorType: 6
});

// 填充颜色 (浅蓝灰色背景)
for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = 240;     // R
        png.data[idx + 1] = 245; // G
        png.data[idx + 2] = 250; // B
        png.data[idx + 3] = 255; // A
    }
}

// 添加一些文字区域（深色矩形模拟电路元件）
function drawRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const px = x + dx;
            const py = y + dy;
            if (px < png.width && py < png.height) {
                const idx = (png.width * py + px) << 2;
                png.data[idx] = r;
                png.data[idx + 1] = g;
                png.data[idx + 2] = b;
                png.data[idx + 3] = 255;
            }
        }
    }
}

// 绘制简单的示意图
// MCU 芯片
drawRect(300, 200, 200, 200, 50, 50, 80);
// LED1
drawRect(550, 250, 40, 40, 255, 100, 100);
// LED2
drawRect(550, 320, 40, 40, 100, 255, 100);
// 按键
drawRect(150, 280, 50, 50, 200, 200, 200);

// 保存
const outputPath = path.join(__dirname, 'sample_schematic.png');
png.pack().pipe(fs.createWriteStream(outputPath));

console.log(`Sample schematic image created: ${outputPath}`);
