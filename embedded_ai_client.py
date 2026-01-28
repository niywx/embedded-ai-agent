"""
Embedded AI Code Generator - Python Client SDK

这是一个用于调用 Embedded AI Code Generator HTTP API 的 Python 客户端库。

安装依赖:
    pip install requests

使用示例:
    from embedded_ai_client import EmbeddedAIClient
    
    # 创建客户端
    client = EmbeddedAIClient('http://localhost:8080')
    
    # 生成代码
    result = client.generate_code(
        datasheet_path='datasheet.pdf',
        schematic_path='schematic.png',
        instruction='生成GPIO初始化代码'
    )
    
    # 保存结果
    with open('generated.c', 'w', encoding='utf-8') as f:
        f.write(result['generated_code'])
    
    print('✓ 代码生成成功！')

作者: Embedded AI Team
版本: 1.0.0
"""

import requests
from typing import Optional, Dict, Any, Union
from pathlib import Path


class EmbeddedAIClient:
    """
    Embedded AI Code Generator API 客户端
    
    提供对嵌入式代码生成服务的便捷访问。
    """
    
    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: int = 60
    ):
        """
        初始化客户端
        
        Args:
            base_url: API 服务器地址，例如 'http://localhost:8080' 或 'https://api.company.com'
            api_key: API 密钥（如果服务器需要认证）
            timeout: 请求超时时间（秒），默认 60 秒
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.session = requests.Session()
        
        # 设置认证头
        if api_key:
            self.session.headers['X-API-Key'] = api_key
    
    def health_check(self) -> Dict[str, Any]:
        """
        健康检查
        
        Returns:
            包含服务状态信息的字典
            
        Raises:
            requests.exceptions.RequestException: 请求失败
        """
        url = f'{self.base_url}/api/v1/health'
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.json()
    
    def get_status(self) -> Dict[str, Any]:
        """
        获取系统状态
        
        Returns:
            包含系统状态信息的字典，包括可用工具、API 配置等
            
        Raises:
            requests.exceptions.RequestException: 请求失败
        """
        url = f'{self.base_url}/api/v1/status'
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.json()
    
    def generate_code(
        self,
        datasheet_path: Optional[Union[str, Path]] = None,
        schematic_path: Optional[Union[str, Path]] = None,
        instruction: str = '生成初始化代码',
        datasheet_url: Optional[str] = None,
        schematic_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        生成嵌入式代码
        
        可以通过文件路径或 URL 两种方式提供数据手册和原理图。
        
        Args:
            datasheet_path: 数据手册文件路径（与 datasheet_url 二选一）
            schematic_path: 原理图文件路径（与 schematic_url 二选一）
            instruction: 代码生成需求描述
            datasheet_url: 数据手册 URL（与 datasheet_path 二选一）
            schematic_url: 原理图 URL（与 schematic_path 二选一）
        
        Returns:
            包含生成代码的字典:
            {
                'status': 'success',
                'generated_code': '生成的 C 代码',
                'metadata': {
                    'processing_time_ms': 12345,
                    'datasheet_analysis': {...},
                    'schematic_analysis': {...}
                }
            }
        
        Raises:
            ValueError: 参数不正确
            requests.exceptions.RequestException: 请求失败
        
        Examples:
            # 使用文件路径
            result = client.generate_code(
                datasheet_path='datasheet.pdf',
                schematic_path='schematic.png',
                instruction='生成GPIO初始化代码'
            )
            
            # 使用 URL
            result = client.generate_code(
                datasheet_url='https://example.com/datasheet.pdf',
                schematic_url='https://example.com/schematic.png',
                instruction='生成I2C驱动代码'
            )
        """
        # 检查参数
        if not (datasheet_path or datasheet_url or schematic_path or schematic_url):
            raise ValueError('必须提供至少一个数据手册或原理图')
        
        # 使用 URL 方式
        if datasheet_url or schematic_url:
            url = f'{self.base_url}/api/v1/generate/url'
            data = {'instruction': instruction}
            
            if datasheet_url:
                data['datasheet_url'] = datasheet_url
            if schematic_url:
                data['schematic_url'] = schematic_url
            
            response = self.session.post(url, json=data, timeout=self.timeout)
        
        # 使用文件上传方式
        else:
            url = f'{self.base_url}/api/v1/generate'
            files = {}
            
            try:
                if datasheet_path:
                    files['datasheet'] = open(datasheet_path, 'rb')
                if schematic_path:
                    files['schematic'] = open(schematic_path, 'rb')
                
                data = {'instruction': instruction}
                
                response = self.session.post(
                    url,
                    files=files,
                    data=data,
                    timeout=self.timeout
                )
            finally:
                # 确保文件被关闭
                for f in files.values():
                    f.close()
        
        response.raise_for_status()
        return response.json()
    
    def analyze_datasheet(
        self,
        file_path: Optional[Union[str, Path]] = None,
        file_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        单独分析数据手册
        
        Args:
            file_path: 数据手册文件路径（与 file_url 二选一）
            file_url: 数据手册 URL（与 file_path 二选一）
        
        Returns:
            包含分析结果的字典
        
        Raises:
            ValueError: 参数不正确
            requests.exceptions.RequestException: 请求失败
        """
        if not (file_path or file_url):
            raise ValueError('必须提供文件路径或 URL')
        
        url = f'{self.base_url}/api/v1/analyze/datasheet'
        
        if file_url:
            response = self.session.post(
                url,
                json={'datasheet_url': file_url},
                timeout=self.timeout
            )
        else:
            with open(file_path, 'rb') as f:
                files = {'datasheet': f}
                response = self.session.post(url, files=files, timeout=self.timeout)
        
        response.raise_for_status()
        return response.json()
    
    def analyze_schematic(
        self,
        file_path: Optional[Union[str, Path]] = None,
        file_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        单独分析原理图
        
        Args:
            file_path: 原理图文件路径（与 file_url 二选一）
            file_url: 原理图 URL（与 file_path 二选一）
        
        Returns:
            包含分析结果的字典
        
        Raises:
            ValueError: 参数不正确
            requests.exceptions.RequestException: 请求失败
        """
        if not (file_path or file_url):
            raise ValueError('必须提供文件路径或 URL')
        
        url = f'{self.base_url}/api/v1/analyze/schematic'
        
        if file_url:
            response = self.session.post(
                url,
                json={'schematic_url': file_url},
                timeout=self.timeout
            )
        else:
            with open(file_path, 'rb') as f:
                files = {'schematic': f}
                response = self.session.post(url, files=files, timeout=self.timeout)
        
        response.raise_for_status()
        return response.json()
    
    def get_docs(self) -> Dict[str, Any]:
        """
        获取 API 文档
        
        Returns:
            包含 API 文档的字典
        """
        url = f'{self.base_url}/api/v1/docs'
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.json()


# 使用示例
if __name__ == '__main__':
    import sys
    
    # 创建客户端
    client = EmbeddedAIClient('http://localhost:8080')
    
    print('=' * 60)
    print('Embedded AI Code Generator - Python Client SDK')
    print('=' * 60)
    print()
    
    try:
        # 1. 健康检查
        print('1. 健康检查...')
        health = client.health_check()
        print(f'   ✓ 服务状态: {health["status"]}')
        print(f'   ✓ 版本: {health["version"]}')
        print()
        
        # 2. 系统状态
        print('2. 系统状态...')
        status = client.get_status()
        print(f'   ✓ Qwen API: {status["qwenApiKey"]}')
        print(f'   ✓ PDF 支持: {status["system"]["tools"]["pdfSupported"]}')
        print()
        
        # 3. 生成代码（需要提供实际文件）
        if len(sys.argv) >= 3:
            print('3. 生成代码...')
            datasheet = sys.argv[1]
            schematic = sys.argv[2]
            instruction = sys.argv[3] if len(sys.argv) > 3 else '生成初始化代码'
            
            print(f'   数据手册: {datasheet}')
            print(f'   原理图: {schematic}')
            print(f'   需求: {instruction}')
            print('   处理中...')
            
            result = client.generate_code(
                datasheet_path=datasheet,
                schematic_path=schematic,
                instruction=instruction
            )
            
            if result['status'] == 'success':
                # 保存代码
                output_file = 'generated.c'
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(result['generated_code'])
                
                print(f'   ✓ 代码生成成功！')
                print(f'   ✓ 处理时间: {result["metadata"]["processing_time_ms"]}ms')
                print(f'   ✓ 保存到: {output_file}')
            else:
                print(f'   ✗ 生成失败: {result.get("message", "未知错误")}')
        else:
            print('3. 生成代码 - 跳过（需要提供文件）')
            print('   用法: python embedded_ai_client.py <datasheet> <schematic> [instruction]')
        
        print()
        print('=' * 60)
        print('✓ 所有测试通过！')
        print('=' * 60)
        
    except requests.exceptions.ConnectionError:
        print('✗ 错误: 无法连接到 API 服务器')
        print('  请确保服务器正在运行: npm run api')
        sys.exit(1)
    except requests.exceptions.Timeout:
        print('✗ 错误: 请求超时')
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f'✗ 错误: {e}')
        sys.exit(1)
    except Exception as e:
        print(f'✗ 未知错误: {e}')
        sys.exit(1)
