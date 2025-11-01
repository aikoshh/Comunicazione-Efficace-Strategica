import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ProblemReport, ReportStatus } from '../types';
import { userService } from '../services/userService';
import { subscribeToProblemReports, updateProblemReportStatus } from '../services/firebase';
import { COLORS } from '../constants';
import { DownloadIcon, UploadIcon } from './Icons';
import { Spinner } from './Loader';
import { useToast } from '../hooks/useToast';

export const AdminScreen: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeUsers = userService.subscribeToUsers((userList) => {
      setUsers(userList);
      setIsLoadingUsers(false);
    });
    
    const unsubscribeReports = subscribeToProblemReports((reportList) => {
        setReports(reportList);
        setIsLoadingReports(false);
    });

    return () => {
        unsubscribeUsers();
        unsubscribeReports();
    };
  }, []);

  const handleSaveUser = async (user: UserProfile) => {
    try {
      await userService.updateUser(user.uid, {
        enabled: user.enabled,
        isAdmin: user.isAdmin,
        expiryDate: user.expiryDate ? new Date(user.expiryDate).toISOString() : null,
      });
      addToast('Utente aggiornato con successo', 'success');
      setEditingUser(null);
    } catch (error: any) {
      addToast(`Errore: ${error.message}`, 'error');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo utente e tutti i suoi dati? L'azione è irreversibile.")) {
      try {
        await userService.deleteUser(uid);
        addToast('Utente eliminato', 'success');
      } catch (error: any) {
        addToast(`Errore: ${error.message}`, 'error');
      }
    }
  };
  
  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
      try {
          await updateProblemReportStatus(reportId, newStatus);
          addToast("Stato aggiornato.", 'success');
      } catch (error: any) {
          addToast(`Errore: ${error.message}`, 'error');
      }
  };

  const handleExport = async () => {
    try {
      const json = await userService.exportDB();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ces-coach-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Database esportato', 'success');
    } catch (error: any) {
      addToast(`Errore esportazione: ${error.message}`, 'error');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if(window.confirm("Sei sicuro di voler importare questo file? L'operazione sovrascriverà tutti i dati attuali.")) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const json = e.target?.result as string;
            await userService.importDB(json);
            addToast('Database importato con successo!', 'success');
          } catch (error: any) {
            addToast(`Errore importazione: ${error.message}`, 'error');
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const getStatusStyle = (status: ReportStatus): React.CSSProperties => {
      switch(status) {
          case 'new': return { color: COLORS.error, fontWeight: 'bold' };
          case 'read': return { color: COLORS.warning, fontWeight: 'bold' };
          case 'resolved': return { color: COLORS.success, fontWeight: 'bold' };
          default: return {};
      }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Pannello di Amministrazione</h1>
        <div style={styles.actions}>
            <button onClick={handleExport} style={styles.actionButton}><DownloadIcon/> Esporta DB</button>
            <button onClick={() => fileInputRef.current?.click()} style={styles.actionButton}><UploadIcon/> Importa DB</button>
            <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".json"/>
        </div>
      </header>

      <section>
        <h2 style={styles.sectionTitle}>Gestione Utenti</h2>
        {isLoadingUsers ? (
            <Spinner size={48} color={COLORS.primary} />
        ) : (
            <div style={styles.tableContainer} className="admin-table-container">
            <table style={styles.table} className="admin-table">
                <thead style={styles.tableHead}>
                <tr>
                    <th style={styles.tableHeader}>Email</th>
                    <th style={styles.tableHeader}>Nome</th>
                    <th style={styles.tableHeader}>Abilitato</th>
                    <th style={styles.tableHeader}>Admin</th>
                    <th style={styles.tableHeader}>Scadenza</th>
                    <th style={styles.tableHeader}>Azioni</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <tr key={user.uid}>
                    <td style={styles.tableCell}>{user.email}</td>
                    <td style={styles.tableCell}>{`${user.firstName} ${user.lastName}`}</td>
                    <td style={styles.tableCell}><input type="checkbox" checked={user.enabled} onChange={(e) => setUsers(users.map(u => u.uid === user.uid ? {...u, enabled: e.target.checked} : u))} /></td>
                    <td style={styles.tableCell}><input type="checkbox" checked={user.isAdmin} onChange={(e) => setUsers(users.map(u => u.uid === user.uid ? {...u, isAdmin: e.target.checked} : u))} /></td>
                    <td style={styles.tableCell}><input type="date" value={user.expiryDate ? user.expiryDate.split('T')[0] : ''} onChange={(e) => setUsers(users.map(u => u.uid === user.uid ? {...u, expiryDate: e.target.value} : u))} /></td>
                    <td style={styles.tableCell}>
                        <button onClick={() => handleSaveUser(user)} style={styles.saveButton}>Salva</button>
                        <button onClick={() => handleDeleteUser(user.uid)} style={styles.deleteButton}>Elimina</button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
      </section>

      <section style={{marginTop: '48px'}}>
        <h2 style={styles.sectionTitle}>Segnalazioni Problemi</h2>
        {isLoadingReports ? (
            <Spinner size={48} color={COLORS.primary} />
        ) : (
            <div style={styles.tableContainer} className="admin-table-container">
                <table style={styles.table} className="admin-table">
                    <thead style={styles.tableHead}>
                        <tr>
                            <th style={styles.tableHeader}>Utente</th>
                            <th style={styles.tableHeader}>Data</th>
                            <th style={{...styles.tableHeader, width: '50%'}}>Messaggio</th>
                            <th style={styles.tableHeader}>Stato</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map(report => (
                            <tr key={report.id}>
                                <td style={styles.tableCell}>{report.userName}<br/><small>{report.userEmail}</small></td>
                                <td style={styles.tableCell}>{new Date(report.timestamp).toLocaleString('it-IT')}</td>
                                <td style={{...styles.tableCell, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{report.message}</td>
                                <td style={styles.tableCell}>
                                    <select value={report.status} onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)} style={getStatusStyle(report.status)}>
                                        <option value="new">Nuovo</option>
                                        <option value="read">Letto</option>
                                        <option value="resolved">Risolto</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: 'bold', color: COLORS.primary },
  sectionTitle: { fontSize: '22px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '20px', borderBottom: `2px solid ${COLORS.secondary}`, paddingBottom: '8px' },
  actions: { display: 'flex', gap: '12px' },
  actionButton: { padding: '10px 16px', fontSize: '15px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  tableContainer: { overflowX: 'auto', backgroundColor: COLORS.card, borderRadius: '12px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  tableHead: {
    backgroundColor: COLORS.cardDark,
  },
  tableHeader: {
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: `1px solid ${COLORS.divider}`,
    fontWeight: 600,
    color: COLORS.textPrimary,
  },
  tableCell: {
    padding: '12px 16px',
    textAlign: 'left',
    verticalAlign: 'top',
    borderBottom: `1px solid ${COLORS.divider}`,
    color: COLORS.textSecondary,
  },
  saveButton: { padding: '6px 12px', backgroundColor: COLORS.success, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' },
  deleteButton: { padding: '6px 12px', backgroundColor: COLORS.error, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};