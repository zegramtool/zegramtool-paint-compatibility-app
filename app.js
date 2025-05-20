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
        console.log('CSVファイルを読み込み中...');
        
        // GitHub Pagesからファイルを取得
        // 複数のファイル名を試行
        let text;
        const possibleFilenames = [
          './塗料互換表_paint.csv',
          './paint.csv',
          './paint-compatibility.csv',
          './data.csv'
        ];
        
        let response = null;
        
        for (const filename of possibleFilenames) {
          try {
            console.log(`${filename} を試行中...`);
            response = await fetch(filename);
            if (response.ok) {
              console.log(`${filename} の読み込みに成功しました`);
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
          dynamicTyping: true
        });
        
        console.log('パース結果:', result);
        
        if (result.errors && result.errors.length > 0) {
          console.warn('CSVパースエラー:', result.errors);
        }
        
        if (!result.data || result.data.length === 0) {
          throw new Error('CSVデータを正しく解析できませんでした');
        }
        
        setPaintData(result.data);
        
        // カテゴリリストを取得
        const uniqueCategories = [...new Set(result.data.map(row => row['カテゴリ']))].filter(Boolean);
        console.log('カテゴリ一覧:', uniqueCategories);
        setCategories(uniqueCategories);
        
        setFilteredData(result.data);
        setLoading(false);
      } catch (error) {
        console.error('エラー発生:', error);
        setError(`ファイルの読み込みに失敗しました: ${error.message}`);
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

  // モバイル用のカードを作成
  const renderMobileCard = (item) => {
    return React.createElement('div', { key: item['番号'], className: "bg-white rounded-lg shadow-md p-3" },
      // ヘッダー部分
      React.createElement('div', { className: "flex justify-between items-start mb-2" },
        React.createElement('div', {},
          React.createElement('span', { className: "text-sm text-gray-500" }, `番号: ${item['番号']}`),
          React.createElement('h3', { className: "font-medium" }, item['カテゴリ'])
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
    
    if (!item[codeField]) {
      return React.createElement('td', { className: 'px-4 py-2' });
    }
    
    return React.createElement('td', { className: 'px-4 py-2' }, 
      React.createElement('div', { className: 'flex items-center' },
        React.createElement('div', { className: `w-6 h-6 rounded-full mr-2 ${getColorFromName(item[nameField], item['番号'])}` }),
        React.createElement('div', {},
          React.createElement('div', { className: 'font-medium' }, item[codeField]),
          React.createElement('div', { className: 'text-sm text-gray-500' }, item[nameField])
        )
      )
    );
  };

  // メインコンポーネントのレンダリング
  return React.createElement('div', { className: 'p-2 sm:p-4 max-w-6xl mx-auto' },
    // ヘッダー
    React.createElement('h1', { className: 'text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center' }, '塗料互換表検索'),
    
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
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'イサム塗料')
            )
          ),
          // テーブルボディ
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            filteredData.map((item, index) => 
              React.createElement('tr', { key: index, className: 'hover:bg-gray-50' },
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap' }, item['番号']),
                React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap' }, item['カテゴリ']),
                renderTableCell(item, 'kansai'),
                renderTableCell(item, 'rock'),
                renderTableCell(item, 'nippon'),
                renderTableCell(item, 'isamu')
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
    )
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
