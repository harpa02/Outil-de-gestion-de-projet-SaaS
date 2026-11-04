import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)'
    }}>
      <Sidebar />
      <main style={{
        flex: 1,
        padding: '32px',
        overflowY: 'auto',
        minWidth: 0
      }}>
        <Outlet />
      </main>
    </div>
  )
}

