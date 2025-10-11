import { COLORS } from '../constants';

// A simple service to generate a print-friendly view of an element.
// This allows users to "Print to PDF" from their browser.
export const printService = {
  printReport: (elementId: string, title: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) {
        console.error("Element to print not found!");
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print the report.");
        return;
    }

    const reportHTML = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              color: ${COLORS.textPrimary};
              margin: 20px;
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
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
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

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Use timeout to ensure content is loaded before printing
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
  },
};

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
        
        const rubricItems = clone.querySelectorAll('[style*="display: contents"]');
        rubricItems.forEach(item => {
            const cells = item.querySelectorAll('div, span');
            if(cells.length >= 3){
                const criterion = cells[0].textContent;
                const score = cells[1].textContent;
                const justification = cells[2].textContent;
                const row = `<tr><td>${criterion}</td><td>${score}</td><td>${justification}</td></tr>`;
                tbody.innerHTML += row;
            }
        });
        table.appendChild(tbody);
        rubricContainer.parentNode?.replaceChild(table, rubricContainer);
    }


    return clone.innerHTML;
}
