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
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [favorites, setFavorites] = React.useState([]);

  // CSVデータの読み込み
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('CSVファイルを読み込み中...');
        
        // GitHub Pagesからファイルを取得
        // 複数のファイル名を試行
        let text;
        const possibleFilenames = [
          './塗料互換表  paint.csv.csv',    // スペース2つ
          './塗料互換表 paint.csv.csv',     // スペース1つ
          './塗料互換表_paint.csv.csv',
          './塗料互換表_paint.csv',
          './paint.csv',
          './paint-compatibility.csv',
          './data.csv'
        ];
        
        let response = null;
        let successFilename = '';
        
        for (const filename of possibleFilenames) {
          try {
            console.log(`${filename} を試行中...`);
            response = await fetch(filename);
            if (response.ok) {
              console.log(`${filename} の読み込みに成功しました`);
              successFilename = filename;
              break;
            }
          } catch (e) {
            console.log(`${filename} の読み込みに失敗: ${e.message}`);
          }
        }
        
        if (!response || !response.ok) {
          throw new Error(`CSVファイルが見つかりません。ファイル名を確認してください。`);
        }
        
        text = await response.text();
        console.log(`${successFilename} からデータを読み込みました`);
        console.log('CSVデータの最初の100文字:', text.substring(0, 100));
        
        // サンプルデータ（CSVが読み込めない場合の代替）
        if (!text || text.trim() === '') {
          console.log('CSVデータが空、サンプルデータを使用します');
          text = `番号,カテゴリ,関西ペイント品番,関西ペイント色名,ロックペイント品番,ロックペイント色名,日本ペイント品番,日本ペイント色名,イサム塗料品番,イサム塗料色名
1,レッド系,KP-101,スーパーレッド,RP-101,ファイヤーレッド,NP-101,ブライトレッド,IP-101,カーディナルレッド
2,ブルー系,KP-201,オーシャンブルー,RP-201,コバルトブルー,NP-201,スカイブルー,IP-201,マリンブルー
3,グリーン系,KP-301,フォレストグリーン,RP-301,エメラルドグリーン,NP-301,ジャングルグリーン,IP-301,ミントグリーン`;
        }
        
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          encoding: "UTF-8", // 文字エンコーディングを明示的に指定
          complete: function(results) {
            console.log('パース完了:', results);
            if (results.errors && results.errors.length > 0) {
              console.warn('パースエラー:', results.errors);
            }
            console.log(`読み込みデータ数: ${results.data.length}件`);
          }
        });
        
        console.log('パース結果:', result);
        
        if (result.errors && result.errors.length > 0) {
          console.warn('CSVパースエラー:', result.errors);
        }
        
        if (!result.data || result.data.length === 0) {
          throw new Error('CSVデータを正しく解析できませんでした');
        }
        
        // 無効なデータを除外（全てのフィールドが空または番号が無いデータは除外）
        const validData = result.data.filter(item => {
          // 番号フィールドが存在するか確認
          const hasNumber = item['番号'] !== undefined && item['番号'] !== null;
          
          // 少なくとも1つのフィールドにデータがあるか確認
          const hasData = Object.values(item).some(val => 
            val !== undefined && val !== null && val !== ''
          );
          
          return hasNumber && hasData;
        });
        
        console.log(`有効なデータ数: ${validData.length}件`);
        
        // データをソート（番号順）
        validData.sort((a, b) => {
          if (a['番号'] === undefined || a['番号'] === null) return 1;
          if (b['番号'] === undefined || b['番号'] === null) return -1;
          return a['番号'] - b['番号'];
        });
        
        setPaintData(validData);
        
        // カテゴリリストを取得
        const uniqueCategories = [...new Set(validData.map(row => row['カテゴリ']))].filter(Boolean);
        console.log('カテゴリ一覧:', uniqueCategories);
        setCategories(uniqueCategories);
        
        setFilteredData(validData);
        
        // お気に入りを読み込み
        loadFavorites();
        
        setLoading(false);
      } catch (error) {
        console.error('エラー発生:', error);
        setError(`ファイルの読み込みに失敗しました: ${error.message}`);
        setLoading(false);
      }
    };

    fetchData();
    
    // お気に入りの読み込み
    const loadFavorites = () => {
      try {
        const storedFavorites = localStorage.getItem('paintFavorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (e) {
        console.error('お気に入りの読み込みに失敗:', e);
      }
    };
    
    loadFavorites();
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
          (item[companyCodeField] !== null && item[companyCodeField] !== undefined && item[companyCodeField] !== '') || 
          (item[companyNameField] !== null && item[companyNameField] !== undefined && item[companyNameField] !== '')
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
      } else if (category.includes('エロー・オレンジ系') || category.includes('イエロー・オレンジ系')) {
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
      } else if (category.includes('ホワイト系')) {
        return 'bg-white border border-gray-300';
      }
    }
    
    // バックアップとして、色名から推測
    if (!colorName) return 'bg-gray-200';
    
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
  
  // 行をクリックした時の処理
  const handleRowClick = (item) => {
    setSelectedRow(item);
  };
  
  // 行の詳細表示をクローズする
  const closeRowDetail = () => {
    setSelectedRow(null);
  };
  
  // お気に入りに追加
  const addToFavorites = (item) => {
    const newFavorites = [...favorites];
    const index = newFavorites.findIndex(fav => fav['番号'] === item['番号']);
    
    if (index === -1) {
      newFavorites.push(item);
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
    }
  };
  
  // お気に入りから削除
  const removeFromFavorites = (item) => {
    const newFavorites = favorites.filter(fav => fav['番号'] !== item['番号']);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };
  
  // お気に入りを保存
  const saveFavorites = (favs) => {
    try {
      localStorage.setItem('paintFavorites', JSON.stringify(favs));
    } catch (e) {
      console.error('お気に入りの保存に失敗:', e);
    }
  };
  
  // お気に入り状態をチェック
  const isFavorite = (item) => {
    return favorites.some(fav => fav['番号'] === item['番号']);
  };
  
  // デバッグパネルの表示/非表示を切り替え
  const toggleDebugPanel = () => {
    setShowDebugPanel(!showDebugPanel);
  };

  // ロード中・エラー時の表示
  if (loading) {
    return React.createElement('div', { className: "flex items-center justify-center h-screen" }, 'データを読み込み中...');
  }

  if (error) {
    return React.createElement('div', { className: "flex items-center justify-center h-screen text-red-600" }, error);
  }

  // 検索アイコン
  const SearchIcon = () => {
    return React.createElement('svg', {
      xmlns: "http://www.w3.org/2000/svg",
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "text-gray-500"
    }, 
      React.createElement('circle', { cx: "11", cy: "11", r: "8" }),
      React.createElement('line', { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
    );
  };
  
  // 星アイコン（お気に入り）
  const StarIcon = ({ filled }) => {
    return React.createElement('svg', {
      xmlns: "http://www.w3.org/2000/svg",
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: filled ? "currentColor" : "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: filled ? "text-yellow-500" : "text-gray-400"
    }, 
      React.createElement('polygon', { 
        points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" 
      })
    );
  };

  // モバイル用のカードを作成
  const renderMobileCard = (item) => {
    return React.createElement('div', { 
      key: item['番号'], 
      className: "bg-white rounded-lg shadow-md p-3 cursor-pointer",
      onClick: () => handleRowClick(item)
    },
      // ヘッダー部分
      React.createElement('div', { className: "flex justify-between items-start mb-2" },
        React.createElement('div', {},
          React.createElement('span', { className: "text-sm text-gray-500" }, `番号: ${item['番号']}`),
          React.createElement('h3', { className: "font-medium" }, item['カテゴリ'])
        ),
        // お気に入りボタン
        React.createElement('button', {
          className: "focus:outline-none",
          onClick: (e) => {
            e.stopPropagation();
            isFavorite(item) ? removeFromFavorites(item) : addToFavorites(item);
          }
        }, 
          React.createElement(StarIcon, { filled: isFavorite(item) })
        )
      ),
      
      // 関西ペイント
      item['関西ペイント品番'] && React.createElement('div', { className: "flex items-center mt-2 border-t pt-2" },
        React.createElement('div', { className: `w-6 h-6 rounded-full mr-2 ${getColorFromName(item['関西ペイント色名'], item['番号'])}` }),
        React.createElement('div', {},
          React.createElement('div', { className: "text-xs text-gray-500" }, "関西ペイント"),
          React.createElement('div', { className: "font-medium text-sm" }, item['関西ペイント品番']),
          React.createElement('div', { className: "text-xs text-gray-500" }, item['関西ペイント色名'])
        )
      ),
      
      // ロックペイント
      item['ロックペイント品番'] && React.createElement('div', { className: "flex items-center mt-2 border-t pt-2" },
        React.createElement('div', { className: `w-6 h-6 rounded-full mr-2 ${getColorFromName(item['ロックペイント色名'], item['番号'])}` }),
        React.createElement('div', {},
          React.createElement('div', { className: "text-xs text-gray-500" }, "ロックペイント"),
          React.createElement('div', { className: "font-medium text-sm" }, item['ロックペイント品番']),
          React.createElement('div', { className: "text-xs text-gray-500" }, item['ロックペイント色名'])
        )
      ),
      
      // 日本ペイント
      item['日本ペイント品番'] && React.createElement('div', { className: "flex items-center mt-2 border-t pt-2" },
        React.createElement('div', { className: `w-6 h-6 rounded-full mr-2 ${getColorFromName(item['日本ペイント色名'], item['番号'])}` }),
        React.createElement('div', {},
          React.createElement('div', { className: "text-xs text-gray-500" }, "日本ペイント"),
          React.createElement('div', { className: "font-medium text-sm" }, item['日本ペイント品番']),
          React.createElement('div', { className: "text-xs text-gray-500" }, item['日本ペイント色名'])
        )
      ),
      
      // イサム塗料
      item['イサム塗料品番'] && React.createElement('div', { className: "flex items-center mt-2 border-t pt-2" },
        React.createElement('div', { className: `w-6 h-6 rounded-full mr-2 ${getColorFromName(item['イサム塗料色名'], item['番号'])}` }),
        React.createElement('div', {},
          React.createElement('div', { className: "text-xs text-gray-500" }, "イサム塗料"),
          React.createElement('div', { className: "font-medium text-sm" }, item['イサム塗料品番']),
          React.createElement('div', { className: "text-xs text-gray-500" }, item['イサム塗料色名'])
        )
      )
    );
  };

  // テーブル用のセルを作成
  const renderTableCell = (item, company) => {
    let codeField, nameField;
    
    switch (company) {
      case 'kansai':
        codeField = '関西ペイント品番';
        nameField = '関西ペイント色名';
        break;
      case 'rock':
        codeField = 'ロックペイント品番';
        nameField = 'ロックペイント色名';
        break;
      case 'nippon':
        codeField = '日本ペイント品番';
        nameField = '日本ペイント色名';
        break;
      case 'isamu':
        codeField = 'イサム塗料品番';
        nameField = 'イサム塗料色名';
        break;
      default:
        return null;
    }
    
    if (!item[codeField] && !item[nameField]) {
      return React.createElement('td', { className: 'px-4 py-2' });
    }
    
    return React.createElement('td', { className: 'px-4 py-2' }, 
      React.createElement('div', { className: 'flex items-center' },
        React.createElement('div', { className: `w-6 h-6 rounded-full mr-2 ${getColorFromName(item[nameField], item['番号'])}` }),
        React.createElement('div', {},
          item[codeField] && React.createElement('div', { className: 'font-medium' }, item[codeField]),
          item[nameField] && React.createElement('div', { className: 'text-sm text-gray-500' }, item[nameField])
        )
      )
    );
  };
  
  // 行の詳細表示
  const renderRowDetail = () => {
    if (!selectedRow) return null;
    
    return React.createElement('div', { 
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    },
      React.createElement('div', { 
        className: 'bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto'
      },
        // ヘッダー
        React.createElement('div', { className: 'flex justify-between items-center p-4 border-b' },
          React.createElement('h3', { className: 'text-xl font-bold' }, `${selectedRow['カテゴリ']}`),
          React.createElement('div', { className: 'flex items-center' },
            // お気に入りボタン
            React.createElement('button', {
              className: 'mr-2 focus:outline-none',
              onClick: () => isFavorite(selectedRow) ? removeFromFavorites(selectedRow) : addToFavorites(selectedRow)
            }, 
              React.createElement(StarIcon, { filled: isFavorite(selectedRow) })
            ),
            // 閉じるボタン
            React.createElement('button', {
              className: 'text-gray-500 hover:text-gray-700 focus:outline-none',
              onClick: closeRowDetail
            }, '✕')
          )
        ),
        
        // 色サンプル
        React.createElement('div', { 
          className: `w-full h-24 ${getColorFromName(selectedRow['カテゴリ'], selectedRow['番号'])}`
        }),
        
        // 詳細情報
        React.createElement('div', { className: 'p-4' },
          // 番号
          React.createElement('div', { className: 'mb-4' },
            React.createElement('span', { className: 'text-gray-500 text-sm' }, '番号:'),
            React.createElement('span', { className: 'ml-2 font-bold' }, selectedRow['番号'])
          ),
          
          // メーカー情報
          React.createElement('div', { className: 'space-y-4' },
            // 関西ペイント
            (selectedRow['関西ペイント品番'] || selectedRow['関西ペイント色名']) && 
            React.createElement('div', { className: 'border-t pt-3' },
              React.createElement('h4', { className: 'font-bold text-gray-800 mb-1' }, '関西ペイント'),
              React.createElement('div', { className: 'flex items-center' },
                React.createElement('div', { 
                  className: `w-8 h-8 rounded-full mr-3 ${getColorFromName(selectedRow['関西ペイント色名'], selectedRow['番号'])}`
                }),
                React.createElement('div', {},
                  selectedRow['関西ペイント品番'] && 
                  React.createElement('div', { className: 'font-medium' }, selectedRow['関西ペイント品番']),
                  selectedRow['関西ペイント色名'] && 
                  React.createElement('div', { className: 'text-sm text-gray-600' }, selectedRow['関西ペイント色名'])
                )
              )
            ),
            
            // ロックペイント
            (selectedRow['ロックペイント品番'] || selectedRow['ロックペイント色名']) && 
            React.createElement('div', { className: 'border-t pt-3' },
              React.createElement('h4', { className: 'font-bold text-gray-800 mb-1' }, 'ロックペイント'),
              React.createElement('div', { className: 'flex items-center' },
                React.createElement('div', { 
                  className: `w-8 h-8 rounded-full mr-3 ${getColorFromName(selectedRow['ロックペイント色名'], selectedRow['番号'])}`
                }),
                React.createElement('div', {},
                  selectedRow['ロックペイント品番'] && 
                  React.createElement('div', { className: 'font-medium' }, selectedRow['ロックペイント品番']),
                  selectedRow['ロックペイント色名'] && 
                  React.createElement('div', { className: 'text-sm text-gray-600' }, selectedRow['ロックペイント色名'])
                )
              )
            ),
            
            // 日本ペイント
            (selectedRow['日本ペイント品番'] || selectedRow['日本ペイント色名']) && 
            React.createElement('div', { className: 'border-t pt-3' },
              React.createElement('h4', { className: 'font-bold text-gray-800 mb-1' }, '日本ペイント'),
              React.createElement('div', { className: 'flex items-center' },
                React.createElement('div', { 
                  className: `w-8 h-8 rounded-full mr-3 ${getColorFromName(selectedRow['日本ペイント色名'], selectedRow['番号'])}`
                }),
                React.createElement('div', {},
                  selectedRow['日本ペイント品番'] && 
                  React.createElement('div', { className: 'font-medium' }, selectedRow['日本ペイント品番']),
                  selectedRow['日本ペイント色名'] && 
                  React.createElement('div', { className: 'text-sm text-gray-600' }, selectedRow['日本ペイント色名'])
                )
              )
            ),
            
            // イサム塗料
            (selectedRow['イサム塗料品番'] || selectedRow['イサム塗料色名']) && 
            React.createElement('div', { className: 'border-t pt-3' },
              React.createElement('h4', { className: 'font-bold text-gray-800 mb-1' }, 'イサム塗料'),
              React.createElement('div', { className: 'flex items-center' },
                React.createElement('div', { 
                  className: `w-8 h-8 rounded-full mr-3 ${getColorFromName(selectedRow['イサム塗料色名'], selectedRow['番号'])}`
                }),
                React.createElement('div', {},
                  selectedRow['イサム塗料品番'] && 
                  React.createElement('div', { className: 'font-medium' }, selectedRow['イサム塗料品番']),
                  selectedRow['イサム塗料色名'] && 
                  React.createElement('div', { className: 'text-sm text-gray-600' }, selectedRow['イサム塗料色名'])
                )
              )
            )
          )
        )
      )
    );
  };
  
  // デバッグパネルの表示
  const renderDebugPanel = () => {
    if (!showDebugPanel) return null;
    
    return React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto'
      },
        // ヘッダー
        React.createElement('div', { className: 'flex justify-between items-center p-4 border-b' },
          React.createElement('h3', { className: 'text-xl font-bold' }, 'デバッグ情報'),
          React.createElement('button', {
            className: 'text-gray-500 hover:text-gray-700 focus:outline-none',
            onClick: () => setShowDebugPanel(false)
          }, '✕')
        ),
        
        // 統計情報
        React.createElement('div', { className: 'p-4' },
          React.createElement('div', { className: 'mb-4' },
            React.createElement('h4', { className: 'font-bold mb-2' }, 'データ統計'),
            React.createElement('ul', { className: 'space-y-1 text-sm' },
              React.createElement('li', {}, `総データ数: ${paintData.length}件`),
              React.createElement('li', {}, `フィルター後のデータ数: ${filteredData.length}件`),
              React.createElement('li', {}, `カテゴリ数: ${categories.length}件`)
            )
          ),
          
          // カテゴリごとの件数
          React.createElement('div', { className: 'mb-4' },
            React.createElement('h4', { className: 'font-bold mb-2' }, 'カテゴリ別件数'),
            React.createElement('div', { className: 'max-h-40 overflow-y-auto bg-gray-50 p-2 rounded text-sm' },
              React.createElement('table', { className: 'w-full' },
                React.createElement('tbody', {},
                  categories.map(category => {
                    const count = paintData.filter(item => item['カテゴリ'] === category).length;
                    return React.createElement('tr', { key: category },
                      React.createElement('td', { className: 'py-1' }, category),
                      React.createElement('td', { className: 'text-right py-1' }, `${count}件`)
                    );
                  })
                )
              )
            )
          ),
          
          // データサンプル
          React.createElement('div', { className: 'mb-4' },
            React.createElement('h4', { className: 'font-bold mb-2' }, 'データサンプル (最初の5件)'),
            React.createElement('pre', { 
              className: 'max-h-40 overflow-y-auto bg-gray-50 p-2 rounded text-xs'
            }, JSON.stringify(paintData.slice(0, 5), null, 2))
          ),
          
          // 修復ボタン
          React.createElement('div', {},
            React.createElement('button', {
              className: 'w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded',
              onClick: () => {
                console.log('データ再読み込み');
                setLoading(true);
                setError(null);
                // 少し遅延させて読み込み画面を表示
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }
            }, 'アプリを再読み込み')
          )
        )
      )
    );
  };

  // お気に入り一覧
  const renderFavorites = () => {
    if (favorites.length === 0) return null;
    
    return React.createElement('div', { className: 'mb-4' },
      React.createElement('div', { className: 'mb-2 font-bold text-sm flex justify-between items-center' },
        React.createElement('span', {}, 'お気に入り'),
        React.createElement('button', {
          className: 'text-xs text-blue-600 hover:text-blue-800',
          onClick: () => {
            if (confirm('お気に入りをすべて削除しますか？')) {
              setFavorites([]);
              saveFavorites([]);
            }
          }
        }, 'すべて削除')
      ),
      React.createElement('div', { className: 'flex overflow-x-auto pb-2' },
        favorites.map(item => 
          React.createElement('div', {
            key: `fav-${item['番号']}`,
            className: 'flex-shrink-0 w-16 mr-2 cursor-pointer',
            onClick: () => handleRowClick(item)
          },
            React.createElement('div', {
              className: `w-16 h-16 rounded mb-1 ${getColorFromName(item['カテゴリ'], item['番号'])}`
            }),
            React.createElement('div', { className: 'text-xs text-center truncate' },
              item['番号']
            )
          )
        )
      )
    );
  };

  // メインコンポーネントのレンダリング
  return React.createElement('div', { className: 'p-2 sm:p-4 max-w-6xl mx-auto' },
    // ヘッダー
    React.createElement('div', { className: 'flex justify-between items-center mb-4 sm:mb-6' },
      React.createElement('h1', { className: 'text-xl sm:text-2xl font-bold' }, '塗料互換表検索'),
      // デバッグボタン
      React.createElement('button', {
        className: 'bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm',
        onClick: toggleDebugPanel
      }, '🔍 ' + paintData.length + '件')
    ),
    
    // お気に入り一覧
    renderFavorites(),
    
    // 検索とフィルターコンテナ
    React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6' },
      React.createElement('div', { className: 'flex flex-col gap-3' },
        // 検索ボックス
        React.createElement('div', { className: 'relative flex-grow' },
          React.createElement('div', { className: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none' },
            React.createElement(SearchIcon)
          ),
          React.createElement('input', {
            type: 'text',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: '品番・色名で検索...',
            className: 'pl-10 w-full p-2 border border-gray-300 rounded-md'
          })
        ),
        
        // フィルターコンテナ
        React.createElement('div', { className: 'flex flex-row gap-2' },
          // カテゴリフィルター
          React.createElement('div', { className: 'w-1/2' },
            React.createElement('select', {
              value: selectedCategory,
              onChange: (e) => setSelectedCategory(e.target.value),
              className: 'w-full p-2 border border-gray-300 rounded-md text-sm'
            },
              React.createElement('option', { value: 'all' }, '全カテゴリ'),
              categories.map((category, index) => 
                React.createElement('option', { key: index, value: category }, category)
              )
            )
          ),
          
          // メーカーフィルター
          React.createElement('div', { className: 'w-1/2' },
            React.createElement('select', {
              value: selectedCompany,
              onChange: (e) => setSelectedCompany(e.target.value),
              className: 'w-full p-2 border border-gray-300 rounded-md text-sm'
            },
              React.createElement('option', { value: 'all' }, '全メーカー'),
              React.createElement('option', { value: 'kansai' }, '関西ペイント'),
              React.createElement('option', { value: 'rock' }, 'ロックペイント'),
              React.createElement('option', { value: 'nippon' }, '日本ペイント'),
              React.createElement('option', { value: 'isamu' }, 'イサム塗料')
            )
          )
        )
      ),
      
      // 検索結果カウント
      React.createElement('div', { className: 'text-sm text-gray-600 mt-2' },
        `検索結果: ${filteredData.length} 件`
      )
    ),
    
    // モバイル用のカードビュー (sm:hidden)
    React.createElement('div', { className: 'sm:hidden' },
      filteredData.length === 0 
        ? React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-4 text-center text-gray-500' },
            '該当する塗料が見つかりませんでした。検索条件を変更してお試しください。'
          )
        : React.createElement('div', { className: 'space-y-3' },
            filteredData.map(item => renderMobileCard(item))
          )
    ),
    
    // PC/タブレット用のテーブルビュー (hidden sm:block)
    React.createElement('div', { className: 'hidden sm:block bg-white rounded-lg shadow-md overflow-hidden' },
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
          // テーブルヘッダー
          React.createElement('thead', { className: 'bg-gray-50' },
            React.createElement('tr', {},
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, '番号'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'カテゴリ'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, '関西ペイント'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'ロックペイント'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, '日本ペイント'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'イサム塗料'),
              React.createElement('th', { className: 'px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10' }, '')
            )
          ),
          // テーブルボディ
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            filteredData.map((item, index) => 
              React.createElement('tr', { 
                key: index, 
                className: 'hover:bg-gray-50 cursor-pointer',
                onClick: () => handleRowClick(item)
              },
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap' }, item['番号']),
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap' }, item['カテゴリ']),
                renderTableCell(item, 'kansai'),
                renderTableCell(item, 'rock'),
                renderTableCell(item, 'nippon'),
                renderTableCell(item, 'isamu'),
                React.createElement('td', { className: 'px-4 py-2 text-center' },
                  React.createElement('button', {
                    className: 'focus:outline-none',
                    onClick: (e) => {
                      e.stopPropagation();
                      isFavorite(item) ? removeFromFavorites(item) : addToFavorites(item);
                    }
                  }, 
                    React.createElement(StarIcon, { filled: isFavorite(item) })
                  )
                )
              )
            )
          )
        )
      ),
      
      filteredData.length === 0 && React.createElement('div', { className: 'px-4 py-10 text-center text-gray-500' },
        '該当する塗料が見つかりませんでした。検索条件を変更してお試しください。'
      )
    ),
    
    // フッター
    React.createElement('div', { className: 'mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500 text-center' },
      '© 2025 塗料互換表検索アプリ'
    ),
    
    // 行の詳細表示モーダル
    renderRowDetail(),
    
    // デバッグパネル
    renderDebugPanel()
  );
}

// PWAとサービスワーカーの登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// アプリをDOMにレンダリング
const root = document.getElementById('root');
ReactDOM.createRoot(root).render(React.createElement(PaintCompatibilityApp));
