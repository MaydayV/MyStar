const fs = require('fs');
const path = require('path');

// 读取 repos.json
const dataPath = path.join(__dirname, 'src/data/repos.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 为每个仓库生成推荐语的函数
function generateRecommendation(repo) {
  const { name, description, topics = [], language, stars } = repo;
  
  // 这里我会根据仓库信息生成推荐语
  // 由于需要人工撰写，这个脚本只是框架
  // 实际的推荐语需要逐个撰写
  
  return `待更新：${name}`;
}

// 更新所有仓库的推荐语
data.repos = data.repos.map(repo => ({
  ...repo,
  recommendation: generateRecommendation(repo)
}));

// 写回文件
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');

console.log(`已更新 ${data.repos.length} 个仓库的推荐语`);
