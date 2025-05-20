'use strict';

// コンポーネントをJSXからJSに変換
function PaintCompatibilityApp() {
  // React Hooksの設定
  const [paintData, setPaintData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [filteredData, setFilteredData] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [selectedCompany, setSelectedCompany] = React.useState('all');

  // CSVデータの読み込み
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // GitHub Pagesからファイルを取得
        const response = await fetch('./塗料互換表_paint.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });
        
        setPaintData(result.data);
        
        // カテゴリリストを取得
        const uniqueCategories = [...new Set(result.data.map(row => row['カテゴリ']))].filter(Boolean);
        setCategories(uniqueCategories);
        
        setFilteredData(result.data);
        setLoading(false);
      } catch (error) {
        console.error('Error reading file:', error);
        setError('ファイルの読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 検索とフィルタリングのロジック
  React.useEffect(() => {
    if (paintData.length > 0) {
      let filtered = [...paintData];
      
      // カテゴリでフィルタリング
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(item => item['カテゴリ'] === selectedCategory);
      }
      
      // メーカーでフィルタリング
      if (selectedCompany !== 'all') {
        let companyCodeField, companyNameField;
        
        switch (selectedCompany) {
          case 'kansai':
            companyCodeField = '関西ペイント品番';
            companyNameField = '関西ペイント色名';
            break;
          case 'rock':
            companyCodeField = 'ロックペイント品番';
            companyNameField = 'ロックペイント色名';
            break;
          case 'nippon':
            companyCodeField = '日本ペイント品番';
            companyNameField = '日本ペイント色名';
            break;
          case 'isamu':
            companyCodeField = 'イサム塗料品番';
            companyNameField = 'イサム塗料色名';
            break;
          default:
            break;
        }
        
        filtered = filtered.filter(item => 
          item[companyCodeField] !== null || 
          item[companyNameField] !== null
        );
      }
      
      // 検索語でフィルタリング
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(item => {
          return (
            (item['カテゴリ'] && String(item['カテゴリ']).toLowerCase().includes(searchLower)) ||
            (item['関西ペイント品番'] && String(item['関西ペイント品番']).toLowerCase().includes(searchLower)) ||
            (item['関西ペイント色名'] && String(item['関西ペイント色名']).toLowerCase().includes(searchLower)) ||
            (item['ロックペイント品番'] && String(item['ロックペイント品番']).toLowerCase().includes(searchLower)) ||
            (item['ロックペイント色名'] && String(item['ロックペイント色名']).toLowerCase().includes(searchLower)) ||
            (item['日本ペイント品番'] && String(item['日本ペイント品番']).toLowerCase().includes(searchLower)) ||
            (item['日本ペイント色名'] && String(item['日本ペイント色名']).toLowerCase().includes(searchLower)) ||
            (item['イサム塗料品番'] && String(item['イサム塗料品番']).toLowerCase().includes(searchLower)) ||
            (item['イサム塗料色名'] && String(item['イサム塗料色名']).toLowerCase().includes(searchLower)) ||
            (item['番号'] && String(item['番号']).toLowerCase().includes(searchLower))
          );
        });
      }
      
      setFilteredData(filtered);
    }
  }, [paintData, searchTerm, selectedCategory, selectedCompany]);

  // カラーサンプルを表示する関数（色名から色を推測）
  const getColorFromName = (colorName, itemNumber) => {
    if (!colorName || !itemNumber) return 'bg-gray-200';
    
    // 行番号ごとに一貫した色を表示するため、番号に基づいて色を決定
    const item = paintData.find(i => i['番号'] === itemNumber);
    if (item) {
      const category = item['カテゴリ'] || '';
      
      // カテゴリで分類
      if (category.includes('レッド系')) {
        return 'bg-red-600';
      } else if (category.includes('エロー・オレンジ系')) {
        return 'bg-orange-500';
      } else if (category.includes('ブルー系')) {
        return 'bg-blue-600';
      } else if (category.includes('グリーン系')) {
        return 'bg-green-600';
      } else if (category.includes('バイオレット・マルーン系')) {
        return 'bg-purple-600';
      } else if (category.includes('ブラウン系')) {
        return 'bg-amber-800';
      } else if (category.includes('ブラック系')) {
        return 'bg-black';
      } else if (category.includes('メタリックベース系')) {
        return 'bg-gradient-to-r from-gray-300 to-gray-100';
      } else if (category.includes('パール系')) {
        return 'bg-gradient-to-r from-gray-200 to-white';
      }
    }
    
    // バックアップとして、色名から推測
    const colorLower = colorName.toLowerCase();
    if (colorLower.includes('ホワイト') || colorLower.includes('白')) return 'bg-white border border-gray-300';
    if (colorLower.includes('ブラック') || colorLower.includes('黒')) return 'bg-black';
    if (colorLower.includes('レッド') || colorLower.includes('赤') || colorLower.includes('マルーン')) return 'bg-red-600';
    if (colorLower.includes('ブルー') || colorLower.includes('青')) return 'bg-blue-600';
    if (colorLower.includes('グリーン') || colorLower.includes('緑')) return 'bg-green-600';
    if (colorLower.includes('イエロー') || colorLower.includes('黄') || colorLower.includes('オレンジ')) return 'bg-orange-500';
    if (colorLower.includes('パープル') || colorLower.includes('バイオレット') || colorLower.includes('紫')) return 'bg-purple-600';
    if (colorLower.includes('ブラウン') || colorLower.includes('茶')) return 'bg-amber-800';
    if (colorLower.includes('グレー') || colorLower.includes('灰')) return 'bg-gray-500';
    if (colorLower.includes('ゴールド') || colorLower.includes('金')) return 'bg-yellow-600';
    if (colorLower.includes('シルバー') || colorLower.includes('銀')) return 'bg-gray-400';
    if (colorLower.includes('メタリック') || colorLower.includes('パール')) return 'bg-gradient-to-r from-gray-300 to-gray-100';
    
    return 'bg-gray-200'; // デフォルト
  };
