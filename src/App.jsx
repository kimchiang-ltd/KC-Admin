import React, { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import KCFactory from './KCFactory.jsx'

const ALLOWED_EMAILS = [
  'kimchiang.ltd@gmail.com',
  'chanavi.pp@gmail.com',
]

// #244 — force re-login once per calendar day (resets at local midnight, not a rolling 24h window)
const todayStr = () => new Date().toDateString()

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('kc_user'))
      if (stored && stored._loginDate === todayStr()) return stored
      localStorage.removeItem('kc_user')
      return null
    } catch { return null }
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
        })
        const profile = await res.json()
        if (ALLOWED_EMAILS.includes(profile.email)) {
          const stamped = { ...profile, _loginDate: todayStr() } // #244
          setUser(stamped)
          localStorage.setItem('kc_user', JSON.stringify(stamped))
          setError('')
        } else {
          setError(profile.email + ' ไม่มีสิทธิ์เข้าใช้งาน')
        }
      } catch(e) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')
  })

  const logout = () => {
    localStorage.removeItem('kc_user')
    setUser(null)
  }

  if (user) return <KCFactory userEmail={user.email} userName={user.name} onLogout={logout} />

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f3f3f3', fontFamily:'Sarabun, sans-serif' }}>
      <div style={{ background:'white', borderRadius:12, padding:40, width:360, textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ width:48, height:48, background:'#032d60', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18, color:'white', margin:'0 auto 16px' }}>KC</div>
        <div style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>KC Admin</div>
        <div style={{ fontSize:13, color:'#6b6b6b', marginBottom:32 }}>ระบบจัดการเอกสาร</div>
        {error && (
          <div style={{ background:'#fdecea', color:'#c23934', padding:'10px 14px', borderRadius:6, fontSize:12, marginBottom:16 }}>
            {error}
          </div>
        )}
        <button
          onClick={() => login()}
          disabled={loading}
          style={{ width:'100%', padding:'10px 0', background:'white', border:'1px solid rgba(0,0,0,0.2)', borderRadius:6, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:'Sarabun, sans-serif' }}
        >
          <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="" />
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>
        <div style={{ fontSize:11, color:'#aaa', marginTop:20 }}>เฉพาะผู้ที่ได้รับอนุญาตเท่านั้น</div>
      </div>
    </div>
  )
}
