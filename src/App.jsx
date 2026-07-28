import React, { useState, useEffect } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import KCFactory from './KCFactory.jsx'
import { api, setAuthToken, clearAuthToken, setOnAuthReject } from './shared/api.jsx' // #299c

// #312 — ALLOWED_EMAILS removed; backend Allowlist sheet is sole authority

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
  const [sessionExpired, setSessionExpired] = useState(false) // #299e

  // #299c/#299e — if the backend rejects a call as "unauthorized" (only once #299b
  // enforcement is live, e.g. the token's midnight exp passed), drop the session and
  // show the session-expired modal — a benign re-auth, not an error.
  useEffect(() => {
    setOnAuthReject(() => {
      clearAuthToken()
      localStorage.removeItem('kc_user')
      setUser(null)
      setSessionExpired(true)
    })
  }, [])

  // #311 — every login failure shows ONE identical generic message; the trailing (รหัส NNN)
  // is an internal diagnostic code, meaningless to outsiders. Map (known only to us):
  //   449 = email authenticated but NOT on the backend Allowlist sheet
  //   491 = Google sign-in failed / cancelled (onError)
  //   492 = userinfo lookup threw / network error
  //   (mid-session expiry no longer shows a code — it routes to the #299e session-expired modal)
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
        })
        const profile = await res.json()
        // #312 — backend Allowlist sheet is sole authority (no client-side filter)
        const auth = await api.login(tokenResponse.access_token)
        if (!auth || !auth.success || !auth.token) {
          setError('เกิดข้อผิดพลาด กรุณาลองใหม่ (รหัส 449)')
        } else {
          setAuthToken(auth.token)
          const stamped = { ...profile, _loginDate: todayStr() } // #244
          setUser(stamped)
          localStorage.setItem('kc_user', JSON.stringify(stamped))
          setError('')
          setSessionExpired(false) // #299e — clear expired state on successful re-login
        }
      } catch(e) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่ (รหัส 492)')
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('เกิดข้อผิดพลาด กรุณาลองใหม่ (รหัส 491)')
  })

  const logout = () => {
    clearAuthToken() // #299c
    localStorage.removeItem('kc_user')
    setUser(null)
  }

  // #299e — session expired mid-use: dedicated re-auth modal (one click satisfies the OAuth popup gesture)
  if (sessionExpired) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f3f3f3', fontFamily:'Prompt, sans-serif' }}>
      <div style={{ background:'white', borderRadius:12, padding:40, width:360, textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ width:48, height:48, background:'#032d60', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18, color:'white', margin:'0 auto 16px' }}>KC</div>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:6 }}>เซสชันหมดอายุ</div>
        <div style={{ fontSize:13, color:'#6b6b6b', marginBottom:28 }}>กรุณาเข้าสู่ระบบใหม่</div>
        <button
          onClick={() => login()}
          disabled={loading}
          style={{ width:'100%', padding:'10px 0', background:'white', border:'1px solid rgba(0,0,0,0.2)', borderRadius:6, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:'Prompt, sans-serif' }}
        >
          <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="" />
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>
      </div>
    </div>
  )

  if (user) return <KCFactory userEmail={user.email} userName={user.name} onLogout={logout} />

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f3f3f3', fontFamily:'Prompt, sans-serif' }}>
      <div style={{ background:'white', borderRadius:12, padding:40, width:360, textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ width:48, height:48, background:'#032d60', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18, color:'white', margin:'0 auto 16px' }}>KC</div>
        <div style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>KC Admin</div>
        <div style={{ fontSize:13, color:'#6b6b6b', marginBottom:32 }}>ระบบบริหารจัดการโรงงาน</div>
        {error && (
          <div style={{ background:'#fdecea', color:'#c23934', padding:'10px 14px', borderRadius:6, fontSize:12, marginBottom:16 }}>
            {error}
          </div>
        )}
        <button
          onClick={() => login()}
          disabled={loading}
          style={{ width:'100%', padding:'10px 0', background:'white', border:'1px solid rgba(0,0,0,0.2)', borderRadius:6, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:'Prompt, sans-serif' }}
        >
          <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="" />
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>
        <div style={{ fontSize:11, color:'#aaa', marginTop:20 }}>เฉพาะผู้ที่ได้รับอนุญาตเท่านั้น</div>
      </div>
    </div>
  )
}
