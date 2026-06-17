import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Trash2, Eraser, Palette, MousePointer2, Plus, Link } from 'lucide-react';

const SimLELogoCreator = () => {
  const [selectedColor, setSelectedColor] = useState('#F58220'); // Domyślny pomarańczowy
  const [toastMessage, setToastMessage] = useState('');
  
  // Wczytywanie stanu rysunku z URL (Base64) lub w ostateczności z pamięci przeglądarki
  const [paintedTriangles, setPaintedTriangles] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('d');
      if (dataParam) {
         const parsed = JSON.parse(atob(dataParam));
         if (parsed.triangles) return parsed.triangles;
      }
      const saved = localStorage.getItem('simle_painted_triangles');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [isDrawing, setIsDrawing] = useState(false);
  
  // Wczytywanie własnych kolorów z URL (Base64) lub w ostateczności z pamięci przeglądarki
  const [customColors, setCustomColors] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('d');
      if (dataParam) {
         const parsed = JSON.parse(atob(dataParam));
         if (parsed.colors) return parsed.colors;
      }
      const saved = localStorage.getItem('simle_custom_colors');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [tempColor, setTempColor] = useState('#000000');

  // Wczytywanie nazwy projektu
  const [projectName, setProjectName] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('d');
      if (dataParam) {
         const parsed = JSON.parse(atob(dataParam));
         if (parsed.projectName) return parsed.projectName;
      }
      const saved = localStorage.getItem('simle_project_name');
      return saved ? saved : 'Projekt';
    } catch (e) {
      return 'Projekt';
    }
  });

  // Efekt zapisujący stan w localStorage oraz kodujący go do Base64 w pasku adresu
  useEffect(() => {
    localStorage.setItem('simle_painted_triangles', JSON.stringify(paintedTriangles));
    localStorage.setItem('simle_custom_colors', JSON.stringify(customColors));
    localStorage.setItem('simle_project_name', projectName);
    
    try {
      const stateToEncode = { triangles: paintedTriangles, colors: customColors, projectName };
      const encoded = btoa(JSON.stringify(stateToEncode));
      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?d=${encoded}`;
      // Zmieniamy adres URL bez przeładowywania strony
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } catch(e) {
      console.error("Błąd kodowania adresu URL", e);
    }
  }, [paintedTriangles, customColors, projectName]);

  // Paleta kolorów bazująca na standardowych kolorach identyfikacji studenckiej / tech
  const colors = [
    { name: 'Pomarańczowy (Główny)', value: '#F58220' },
    { name: 'Granatowy (Główny)', value: '#163A5F' },
    { name: 'Ciemny Granat', value: '#0B1D30' },
    { name: 'Jasny Niebieski', value: '#4BB7E6' },
    { name: 'Oliwkowy', value: '#D4CA05' }, 
    { name: 'Ciemnozielony', value: '#3B6329' }, 
    { name: 'Morski', value: '#2B7A87' }, 
    { name: 'Ciemny Morski', value: '#062D34' },
    { name: 'Szary (Podany)', value: '#D4D3D3' }, 
    { name: 'Ciemny Szary', value: '#58595B' },
    { name: 'Biały', value: '#FFFFFF' }
  ];

  // Konfiguracja siatki trójkątów (szablonu)
  const gridConfig = useMemo(() => {
    const side = 40; // Długość boku trójkąta
    const h = side * Math.sqrt(3) / 2; // Wysokość trójkąta
    const rows = 18; // Liczba wierszy
    const cols = 32; // Liczba kolumn (pół-szerokości boku)
    
    const width = (cols * side) / 2 + side / 2;
    const height = rows * h;

    const triangles = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let x = c * side / 2;
        let y = r * h;

        // Funkcja formatująca punkty do stałej dokładności - niezbędne dla
        // perfekcyjnego łączenia wierzchołków i usuwania problemów z precyzją JS
        const pt = (px, py) => `${px.toFixed(3)},${py.toFixed(3)}`;

        // Jeśli (r + c) jest parzyste -> trójkąt skierowany w górę
        if ((r + c) % 2 === 0) {
          triangles.push({
            id: `${r}-${c}`,
            // Zapis zgodny z ruchem wskazówek zegara (CW)
            points: `${pt(x, y + h)} ${pt(x + side / 2, y)} ${pt(x + side, y + h)}`
          });
        } else {
          // Jeśli nieparzyste -> trójkąt skierowany w dół
          triangles.push({
            id: `${r}-${c}`,
            // Modyfikacja zapisu, aby również był zgodny z ruchem wskazówek zegara (CW)
            // Ujednolicony wektor krawędzi pozwala algorytmowi łączyć ścieżki SVG
            points: `${pt(x, y)} ${pt(x + side, y)} ${pt(x + side / 2, y + h)}`
          });
        }
      }
    }

    return { triangles, width, height };
  }, []);

  // Globalny listener do obsługi puszczania przycisku myszy (zakończenie malowania)
  useEffect(() => {
    const handleMouseUp = () => setIsDrawing(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleTriangleInteraction = useCallback((id) => {
    setPaintedTriangles(prev => {
      // Jeśli wybrany kolor to "gumka" (null), usuwamy wpis
      if (selectedColor === null) {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      }
      // W przeciwnym razie aktualizujemy kolor
      return { ...prev, [id]: selectedColor };
    });
  }, [selectedColor]);

  const clearCanvas = () => {
    setPaintedTriangles({});
  };

  const copyShareLink = () => {
    const el = document.createElement('textarea');
    el.value = window.location.href;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    setToastMessage('Link z projektem skopiowany do schowka!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const downloadSvg = () => {
    // Filtrujemy tylko pomalowane trójkąty
    const paintedShapes = gridConfig.triangles.filter(t => paintedTriangles[t.id] !== undefined);

    if (paintedShapes.length === 0) {
      setToastMessage('Brak elementów do eksportu!');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    // Obliczanie obszaru zajmowanego tylko przez narysowany kształt (bounding box)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paintedShapes.forEach(triangle => {
      triangle.points.split(' ').forEach(pt => {
        const [x, y] = pt.split(',').map(Number);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });

    // Parametry bazowe trójkąta z gridConfig do obliczenia obszaru ochronnego
    const side = 40; 
    const h = side * Math.sqrt(3) / 2; 

    // Obszar ochronny: 2 jednostki trójkątów z każdej strony
    const paddingX = side * 2; // 2 pełne szerokości w poziomie
    const paddingY = h * 2;    // 2 pełne wysokości w pionie

    const vX = minX - paddingX;
    const vY = minY - paddingY;
    const vWidth = (maxX - minX) + paddingX * 2;
    const vHeight = (maxY - minY) + paddingY * 2;

    // --- ŁĄCZENIE TRÓJKĄTÓW W JEDNOLITE ŚCIEŻKI SVG (UNION PATHS) ---
    const colorGroups = {};
    paintedShapes.forEach(t => {
      const color = paintedTriangles[t.id];
      if (!colorGroups[color]) colorGroups[color] = [];
      colorGroups[color].push(t);
    });

    let pathsSvg = '';

    for (const [color, triangles] of Object.entries(colorGroups)) {
      const edges = new Map();

      // Krok 1: Identyfikacja wszystkich krawędzi trójkątów
      triangles.forEach(t => {
        const pts = t.points.split(' ');
        for (let i = 0; i < 3; i++) {
          const from = pts[i];
          const to = pts[(i + 1) % 3];
          const edgeKey = `${from}|${to}`;
          const reverseKey = `${to}|${from}`;

          // Jeżeli odwrotna krawędź już istnieje, oznacza to że dwa trójkąty tego samego koloru 
          // stykają się tym bokiem. Usuwamy ją, by pozostawić wyłącznie zarys zewnętrzny.
          if (edges.has(reverseKey)) {
            edges.delete(reverseKey);
          } else {
            edges.set(edgeKey, { from, to });
          }
        }
      });

      // Krok 2: Konstruowanie ciągłych ścieżek z odfiltrowanych krawędzi brzegowych
      let colorPaths = '';
      while (edges.size > 0) {
        // Bierzemy pierwszą dowolną krawędź ze stosu jako start
        const [firstKey, firstEdge] = edges.entries().next().value;
        edges.delete(firstKey);

        let currentPath = `M ${firstEdge.from.replace(',', ' ')} L ${firstEdge.to.replace(',', ' ')}`;
        let currentTo = firstEdge.to;
        const startNode = firstEdge.from;

        // Szukamy następników budując obrys aż wrócimy do punktu startu
        while (currentTo !== startNode) {
          let nextEdgeKey = null;
          for (const [key, edge] of edges.entries()) {
            if (edge.from === currentTo) {
              nextEdgeKey = key;
              break;
            }
          }

          if (!nextEdgeKey) break; // Awaryjne przerwanie (na siatce się nie zdarza)

          const nextEdge = edges.get(nextEdgeKey);
          currentPath += ` L ${nextEdge.to.replace(',', ' ')}`;
          currentTo = nextEdge.to;
          edges.delete(nextEdgeKey);
        }
        currentPath += ' Z';
        colorPaths += currentPath + ' ';
      }

      // Finalne zapisanie całego konturu dla danego koloru (może składać się z wysp/dziur)
      pathsSvg += `  <path d="${colorPaths.trim()}" fill="${color}" />\n`;
    }

    // Generowanie czystego kodu SVG
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${vWidth}" height="${vHeight}" viewBox="${vX} ${vY} ${vWidth} ${vHeight}">\n`;
    svgContent += pathsSvg;
    svgContent += `</svg>`;

    const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Formatowanie daty i dynamicznej nazwy pliku
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const safeProjectName = projectName.trim().replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ_-]/g, '_') || 'Projekt';
    const fileName = `SimLE_${safeProjectName}_${dateStr}.svg`;
    
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setToastMessage(`Pobrano plik: ${fileName}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Nagłówek */}
      <header className="bg-[#062D34] text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wider flex items-center gap-2">
              <Palette className="w-6 h-6 text-[#D4CA05]" />
              Kreator Logo / Sygnetu
            </h1>
            <p className="text-gray-300 text-sm mt-1 max-w-xl">
              Zaznaczaj trójkąty na siatce, aby stworzyć dynamiczną kompozycję inspirowaną ciągiem Fibonacciego i geometrią, zgodnie z księgą znaku.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Nazwa projektu"
              maxLength={30}
              className="bg-white/10 border border-white/20 text-white placeholder-white/50 px-3 py-2 rounded-md text-sm focus:outline-none focus:border-[#D4CA05] focus:bg-white/20 transition-colors w-full sm:w-40"
              title="Nazwa projektu"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={clearCanvas}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-sm font-medium"
                title="Wyczyść płótno"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Wyczyść</span>
              </button>
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 px-3 py-2 bg-[#D4CA05]/20 hover:bg-[#D4CA05]/30 text-[#D4CA05] border border-[#D4CA05]/50 rounded-md transition-colors text-sm font-medium"
                title="Skopiuj link do udostępnienia"
              >
                <Link className="w-4 h-4" />
                <span className="hidden md:inline">Udostępnij</span>
              </button>
              <button
                onClick={downloadSvg}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4CA05] hover:bg-[#b8ae04] text-[#062D34] rounded-md transition-colors text-sm font-bold shadow-sm"
              >
                <Download className="w-4 h-4" />
                Pobierz SVG
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Komunikat o skopiowaniu (Toast) */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#062D34] text-[#D4CA05] px-6 py-3 rounded-md shadow-lg border border-[#D4CA05]/20 z-50 flex items-center gap-2 transition-opacity">
          <Link className="w-4 h-4" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Pasek Narzędzi */}
        <aside className="w-full lg:w-64 bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Narzędzia</h2>
          
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-[#062D34]" />
              Akcja
            </h3>
            <button
              onClick={() => setSelectedColor(null)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border transition-all ${
                selectedColor === null 
                  ? 'bg-[#062D34]/5 border-[#062D34]/30 text-[#062D34] shadow-sm font-medium' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Eraser className="w-4 h-4" />
              Gumka
            </button>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#062D34]" />
              Paleta kolorów
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`group relative h-12 rounded-lg border-2 transition-all ${
                    selectedColor === color.value 
                      ? 'border-gray-900 scale-105 shadow-md' 
                      : 'border-transparent hover:scale-105 shadow-sm'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {/* Subtelny obrys dla białego koloru */}
                  {color.value === '#FFFFFF' && (
                    <div className="absolute inset-0 border border-gray-200 rounded-md pointer-events-none" />
                  )}
                </button>
              ))}
              
              {/* Wyrenderowane własne kolory */}
              {customColors.map((color, index) => (
                <button
                  key={`custom-${index}`}
                  onClick={() => setSelectedColor(color)}
                  className={`group relative h-12 rounded-lg border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-900 scale-105 shadow-md' 
                      : 'border-transparent hover:scale-105 shadow-sm'
                  }`}
                  style={{ backgroundColor: color }}
                  title="Własny kolor"
                />
              ))}
            </div>

            {/* Formularz dodawania własnego koloru (po zatwierdzeniu) */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nowy kolor</h4>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value.toUpperCase())}
                  className="w-10 h-10 p-0.5 border border-gray-200 rounded cursor-pointer bg-white shrink-0"
                  title="Wybierz nowy kolor"
                />
                <button
                  onClick={() => {
                    if (!customColors.includes(tempColor) && !colors.some(c => c.value === tempColor)) {
                      setCustomColors(prev => [...prev, tempColor]);
                    }
                    setSelectedColor(tempColor);
                  }}
                  className="flex-1 bg-gray-50 hover:bg-[#D4CA05]/20 border border-gray-200 hover:border-[#D4CA05] text-gray-700 hover:text-[#062D34] text-sm font-medium py-2 rounded-md flex items-center justify-center gap-1 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Zatwierdź
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-[#D4CA05]/10 rounded-lg border border-[#D4CA05]/30 text-sm text-[#062D34]">
            <p><strong>Wskazówka:</strong> Przytrzymaj lewy przycisk myszy i przeciągnij po siatce, aby szybko zamalować wiele trójkątów na raz.</p>
          </div>
        </aside>

        {/* Obszar Roboczy */}
        <section className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex items-center justify-center p-4">
          <div className="overflow-auto max-w-full max-h-full">
            <svg
              id="logo-canvas"
              width={gridConfig.width}
              height={gridConfig.height}
              viewBox={`0 0 ${gridConfig.width} ${gridConfig.height}`}
              className="bg-transparent touch-none cursor-crosshair"
              style={{ minWidth: gridConfig.width, minHeight: gridConfig.height }}
              onMouseLeave={() => setIsDrawing(false)}
            >
              {gridConfig.triangles.map((triangle) => {
                const isPainted = paintedTriangles[triangle.id] !== undefined;
                const fillColor = isPainted ? paintedTriangles[triangle.id] : 'transparent';
                // Aby uniknąć brzydkich przerw między trójkątami, nadajemy im lekki stroke w kolorze wypełnienia
                const strokeColor = isPainted ? paintedTriangles[triangle.id] : '#E5E7EB';
                
                return (
                  <polygon
                    key={triangle.id}
                    points={triangle.points}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isPainted ? "1" : "0.5"}
                    className="transition-colors duration-75"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Zapobiega systemowemu przeciąganiu elementu
                      setIsDrawing(true);
                      handleTriangleInteraction(triangle.id);
                    }}
                    onMouseEnter={() => {
                      if (isDrawing) {
                        handleTriangleInteraction(triangle.id);
                      }
                    }}
                  />
                );
              })}
            </svg>
          </div>
        </section>

      </main>
    </div>
  );
};

export default SimLELogoCreator;