import { useState } from 'react';
import GroupSelector from '../../components/QueryGenerator/GroupSelector';
import IdInput from '../../components/QueryGenerator/IdInput';
import SqlOutput from '../../components/QueryGenerator/SqlOutput';
import OutputFormatSelector from '../../components/QueryGenerator/OutputFormatSelector';
import { getTemplateForGroup } from '../../utils/queryTemplates';
import { usePageTitle } from '../../utils/pageTitle';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Copy, Check, Database, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const GenerateQueries = () => {
  // Menambahkan judul halaman
  usePageTitle('Generate Query');

  const [selectedGroup, setSelectedGroup] = useState('query_in_custom');
  const [ids, setIds] = useState('');
  const [yardLoc, setYardLoc] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');
  const [error, setError] = useState('');
  const [outputFormat, setOutputFormat] = useState('in_clause');
  const [fieldName, setFieldName] = useState('kolom');
  const [showFormatOptions, setShowFormatOptions] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    setShowFormatOptions(groupId === 'query_in_custom');
    setGeneratedSql(''); // Reset SQL output when group changes
  };

  const handleIdsChange = (value) => {
    setIds(value);
    setGeneratedSql(''); // Reset SQL output when IDs change
  };

  const handleYardLocChange = (value) => {
    setYardLoc(value);
    setGeneratedSql(''); // Reset SQL output when yard location changes
  };

  const handleMarketplaceChange = (value) => {
    setMarketplace(value);
    setGeneratedSql(''); // Reset SQL output when marketplace changes
  };

  const handleOutputFormatChange = (format) => {
    setOutputFormat(format);
    setGeneratedSql(''); // Reset SQL output when format changes
  };

  const handleFieldNameChange = (e) => {
    setFieldName(e.target.value);
    setGeneratedSql(''); // Reset SQL output when field name changes
  };

  const handleCopy = async () => {
    if (!generatedSql) return;
    
    try {
      // Cek apakah Clipboard API tersedia
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedSql);
      } else {
        // Fallback method menggunakan document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = generatedSql;
        textArea.style.position = 'fixed';  // Mencegah scrolling ke bawah
        textArea.style.opacity = '0';       // Membuat invisible
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        if (!successful) {
          throw new Error('Gagal menyalin menggunakan execCommand');
        }
        
        document.body.removeChild(textArea);
      }
      
      setCopySuccess(true);
      
      // Reset pesan sukses setelah 2 detik
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Gagal menyalin ke clipboard:', err);
      setError('Gagal menyalin ke clipboard. Coba metode lain atau salin secara manual.');
    }
  };

  const validateInput = () => {
    // Validasi format ID
    if (!ids.trim()) {
      setError('Daftar ID tidak boleh kosong');
      return false;
    }

    // Split by comma or newline
    const idList = ids.split(/[,\n]/).map(id => id.trim()).filter(id => id);
    
    if (idList.length === 0) {
      setError('Daftar ID tidak boleh kosong');
      return false;
    }

    // Validasi jumlah maksimal ID (kecuali untuk grup query_in_custom)
    if (selectedGroup !== 'query_in_custom' && idList.length > 500) {
      setError('Maksimal 500 ID diperbolehkan');
      return false;
    }

    // Validasi format alfanumerik (dengan spasi)
    const invalidIds = idList.filter(id => !/^[a-zA-Z0-9-_\/+.\s]+$/.test(id));
    if (invalidIds.length > 0) {
      setError(`ID harus alfanumerik (menerima karakter -, _, /, +, ., dan spasi): ${invalidIds.join(', ')}`);
      return false;
    }

    // Validasi yard_loc untuk Reopen Door
    if (selectedGroup === 'reopen_door' && !yardLoc.trim()) {
      setError('Yard location diperlukan untuk grup Reopen Door');
      return false;
    }

    // Validasi marketplace untuk Sync IsUpdate
    if (selectedGroup === 'sync_isupdate' && !marketplace.trim()) {
      setError('Marketplace diperlukan untuk grup Sync IsUpdate');
      return false;
    }

    // Validasi nama field untuk WHERE clause
    if (selectedGroup === 'query_in_custom' && outputFormat === 'where_clause' && !fieldName.trim()) {
      setError('Nama kolom diperlukan untuk format WHERE clause');
      return false;
    }

    return true;
  };

  // Fungsi untuk memproses ID, mempertahankan spasi
  const processId = (id) => {
    return id.trim(); // Hanya trim whitespace di awal dan akhir, pertahankan spasi di tengah
  };

  const handleGenerateSql = async () => {
    setError('');
    setIsGenerating(true);
    
    if (!validateInput()) {
      setIsGenerating(false);
      return;
    }

    try {
      // Parse IDs dan proses untuk mengganti spasi dengan "-"
      const idList = ids.split(/[,\n]/).map(id => processId(id)).filter(id => id);
      
      // Get template for selected group
      let template = getTemplateForGroup(selectedGroup);
      
      // Khusus untuk query_in_custom, sesuaikan dengan format output
      if (selectedGroup === 'query_in_custom') {
        if (outputFormat === 'where_clause') {
          // Hanya output daftar ID, tanpa WHERE ... IN (...)
          template = '{IDS}';
        }
      }
      
      // Replace placeholders with actual values
      let sql = template;
      
      // Replace ID placeholders
      if (outputFormat === 'where_clause') {
        sql = idList.map((id, idx) => {
          const isLast = idx === idList.length - 1;
          return `(\'${id}\')${isLast ? '' : ','}`;
        }).join('\n');
      } else {
        sql = sql.replace(/\{IDS\}/g, idList.map(id => `\'${id}\'`).join(','));
      }
      
      // Replace yard_loc if needed
      if (selectedGroup === 'reopen_door' && yardLoc) {
        sql = sql.replace(/\{YARD_LOC\}/g, yardLoc);
      }

      // Replace marketplace if needed
      if (selectedGroup === 'sync_isupdate' && marketplace) {
        sql = sql.replace(/\{MARKETPLACE\}/g, marketplace);
      }
      
      setGeneratedSql(sql);
    } catch (err) {
      setError('Gagal generate SQL: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-[95rem]">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SQL Query Generator
          </h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Input Section */}
          <div className="lg:col-span-9 space-y-6">
            {/* Top Row - Query Group and Input Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Query Group */}
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Query Group</CardTitle>
                  <CardDescription>Choose query type</CardDescription>
                </CardHeader>
                <CardContent>
                  <GroupSelector 
                    selectedGroup={selectedGroup} 
                    onGroupChange={handleGroupChange} 
                  />
                </CardContent>
              </Card>

              {/* ID Input */}
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Input Data</CardTitle>
                  <CardDescription>Enter IDs & parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  <IdInput 
                    ids={ids} 
                    yardLoc={yardLoc}
                    marketplace={marketplace}
                    showYardLoc={selectedGroup === 'reopen_door'}
                    showMarketplace={selectedGroup === 'sync_isupdate'}
                    onIdsChange={handleIdsChange}
                    onYardLocChange={handleYardLocChange}
                    onMarketplaceChange={handleMarketplaceChange}
                    isCustomInQuery={selectedGroup === 'query_in_custom'}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Format Options */}
            {showFormatOptions && (
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Output Format</CardTitle>
                  <CardDescription>Select your preferred output format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <OutputFormatSelector 
                      format={outputFormat}
                      fieldName={fieldName}
                      onFormatChange={handleOutputFormatChange}
                    />
                    
                    {outputFormat === 'where_clause' && (
                      <div>
                        <label 
                          htmlFor="field-name" 
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Nama Kolom
                        </label>
                        <input
                          type="text"
                          id="field-name"
                          value={fieldName}
                          onChange={handleFieldNameChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Masukkan nama kolom"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <div className="flex gap-3">
              <Button 
                onClick={handleGenerateSql}
                disabled={isGenerating}
                className="flex-1 h-12 text-base bg-primary hover:bg-primary/90"
              >
                {isGenerating ? 'Generating...' : 'Generate SQL'}
              </Button>
              
              {generatedSql && (
                <Button 
                  onClick={handleCopy}
                  variant="outline"
                  className={cn(
                    "h-12 flex items-center gap-2",
                    copySuccess && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  )}
                >
                  {copySuccess ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Output Section */}
          <div className="lg:col-span-3">
            {generatedSql && (
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl">Generated SQL</CardTitle>
                  <CardDescription>Your query is ready</CardDescription>
                </CardHeader>
                <CardContent>
                  <SqlOutput 
                    sql={generatedSql} 
                    showCopyButton={false}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateQueries; 