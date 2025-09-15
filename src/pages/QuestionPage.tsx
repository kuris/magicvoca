import React from 'react';
import { QuestionBoard } from '../App';

export default function QuestionPage() {
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb'}}>
      <div style={{maxWidth:400,margin:'32px auto 0',padding:0}}>
        <button onClick={()=>window.location.href='/'} style={{marginBottom:16,padding:'8px 16px',borderRadius:4,background:'#e5e7eb',color:'#2563eb',border:'none',fontWeight:'bold'}}>← 돌아가기</button>
      </div>
      <QuestionBoard />
    </div>
  );
}
