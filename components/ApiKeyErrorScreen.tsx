import React from 'react';
import { WarningIcon } from './Icons';
import { COLORS } from '../constants';

// FIX: Replaced JSX.Element with React.ReactElement
export default function ApiKeyErrorScreen(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border border-red-200">
        <div className="flex flex-col items-center text-center">
            <WarningIcon className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-3xl font-bold text-nero mb-2">Configurazione Richiesta</h1>
            <p className="text-gray-600 mb-6">
                Per attivare l'analisi AI, è necessario impostare la tua chiave API di Google.
            </p>

            <div className="text-left bg-gray-50 p-6 rounded-lg border w-full">
                <h2 className="text-lg font-semibold text-nero mb-3">Segui questi passaggi:</h2>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li>
                        Nel pannello di questo ambiente di sviluppo, trova la sezione <strong>Secrets</strong> (ha un'icona a forma di chiave 🔑).
                    </li>
                    <li>
                        <strong>Elimina</strong> qualsiasi chiave API creata in precedenza per evitare conflitti.
                    </li>
                    <li>
                        Crea un <strong>nuovo</strong> secret:
                        <ul className="list-disc list-inside ml-5 mt-2 p-3 bg-gray-100 rounded-md">
                            <li>
                                <strong>Nome:</strong>
                                <code className="bg-red-100 text-red-800 px-2 py-1 rounded font-mono text-sm mx-1">API_KEY</code>
                                (deve essere scritto esattamente così).
                            </li>
                            <li>
                                <strong>Valore:</strong> Incolla qui la tua chiave API di Google.
                            </li>
                        </ul>
                    </li>
                    <li>
                        Salva la chiave e poi <strong>ricarica completamente questa pagina</strong> nel browser.
                    </li>
                </ol>
            </div>

            <p className="text-sm text-gray-500 mt-6">
                Questa operazione è necessaria solo una volta. La tua chiave API rimane privata e sicura.
            </p>
        </div>
      </div>
    </div>
  );
}
