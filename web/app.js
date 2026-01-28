/**
 * @file app.js
 * @brief Web UI 前端逻辑
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const resultCode = document.getElementById('resultCode');
    const errorMessage = document.getElementById('errorMessage');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // 隐藏之前的结果
        result.classList.remove('show');
        error.classList.remove('show');

        // 显示加载状态
        submitBtn.disabled = true;
        loading.classList.add('show');

        try {
            // 获取表单数据
            const formData = new FormData();
            formData.append('datasheet', document.getElementById('datasheet').files[0]);
            formData.append('schematic', document.getElementById('schematic').files[0]);
            formData.append('instruction', document.getElementById('instruction').value);

            // 发送请求
            const response = await fetch('/api/generate', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            // 隐藏加载状态
            loading.classList.remove('show');
            submitBtn.disabled = false;

            if (data.status === 'success') {
                // 显示成功结果
                resultCode.textContent = data.generated_code || '代码生成成功！';
                result.classList.add('show');
                
                // 滚动到结果区域
                result.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // 显示错误
                errorMessage.textContent = data.error_message || '未知错误';
                error.classList.add('show');
                error.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

        } catch (err) {
            // 隐藏加载状态
            loading.classList.remove('show');
            submitBtn.disabled = false;

            // 显示错误
            errorMessage.textContent = `请求失败: ${err.message}\n\n请确保后端服务器正在运行 (npm start)`;
            error.classList.add('show');
            error.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // 文件选择提示
    document.getElementById('datasheet').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            console.log('Datasheet selected:', e.target.files[0].name);
        }
    });

    document.getElementById('schematic').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            console.log('Schematic selected:', e.target.files[0].name);
        }
    });
});
