import { COLORS } from '../constants';

function getClonedAndCleanedHTML(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove interactive elements that are not needed for print
    clone.querySelectorAll('button, .no-print').forEach(el => el.remove());
    
    // Handle score circle for printing
    const scoreText = clone.querySelector('[style*="position: absolute"]');
    if (scoreText) {
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-circle-print';
        scoreDiv.textContent = `Punteggio: ${scoreText.textContent}`;
        const scoreSVG = clone.querySelector('svg');
        scoreSVG?.parentNode?.replaceChild(scoreDiv, scoreSVG);
    }
    
    // Handle detailed rubric for printing
    const rubricContainer = clone.querySelector('[style*="grid-template-columns: auto 1fr"]');
    if (rubricContainer) {
        const table = document.createElement('table');
        table.className = 'rubric-table';
        table.innerHTML = '<thead><tr><th>Criterio</th><th>Punteggio</th><th>Motivazione</th></tr></thead>';
        const tbody = document.createElement('tbody');
        
        const children = Array.from(rubricContainer.children);
        for (let i = 0; i < children.length; i += 3) {
            if (children[i+2]) {
                const criterion = children[i].textContent;
                const scoreContainer = children[i+1];
                const score = scoreContainer.querySelector('span')?.textContent;
                const justification = children[i+2].textContent;
                const row = `<tr><td>${criterion}</td><td>${score}</td><td>${justification}</td></tr>`;
                tbody.innerHTML += row;
            }
        }
        
        table.appendChild(tbody);
        rubricContainer.parentNode?.replaceChild(table, rubricContainer);
    }

    return clone.innerHTML;
}


export const printService = {
  getReportHTML: (elementId: string, title: string): string | null => {
    const printContent = document.getElementById(elementId);
    if (!printContent) {
        console.error("Element to print not found!");
        return null;
    }

    return `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            body {
              font-family: 'Poppins', sans-serif;
              color: ${COLORS.textPrimary};
              margin: 20px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h1, h2, h3 {
              color: ${COLORS.primary};
              border-bottom: 2px solid ${COLORS.secondary};
              padding-bottom: 5px;
            }
            ul {
              list-style-type: none;
              padding-left: 0;
            }
            li {
              background-color: #f9f9f9;
              margin-bottom: 10px;
              padding: 10px;
              border-left: 4px solid ${COLORS.secondary};
            }
            .no-print { display: none !important; }
            .score-circle-print {
                text-align: center;
                font-size: 48px;
                font-weight: bold;
                color: ${COLORS.primary};
                margin: 20px 0;
            }
            .rubric-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .rubric-table th, .rubric-table td {
                border: 1px solid ${COLORS.divider};
                padding: 12px;
                text-align: left;
            }
            .rubric-table th {
                background-color: ${COLORS.cardDark};
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${getClonedAndCleanedHTML(printContent)}
        </body>
      </html>
    `;
  },

  triggerPrint: (reportHTML: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(reportHTML);
        doc.close();

        const handlePrint = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
        };
        
        // Wait for images and styles to load
        iframe.onload = handlePrint;

        // Fallback for browsers that don't fire onload for srcdoc
        setTimeout(handlePrint, 500);

    } else {
        alert("Impossibile aprire la finestra di stampa. Assicurati che il tuo browser non stia bloccando i popup.");
        document.body.removeChild(iframe);
    }
  }
};