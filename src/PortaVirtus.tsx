// @ts-nocheck — componente "soberano" copiado desde Claude artifacts.
// No refactorizar a TS estricto. Ver docs/conventions.md §"Componentes soberanos".
import { useState, useEffect, useCallback, useRef } from "react";

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    @keyframes bounceIn{0%{transform:translateY(-60px) scale(0.8);opacity:0}60%{transform:translateY(8px) scale(1.04);opacity:1}80%{transform:translateY(-4px) scale(0.98)}100%{transform:translateY(0) scale(1);opacity:1}}
    @keyframes slideUp{from{transform:translateY(0);opacity:1}to{transform:translateY(-30px);opacity:0}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes popIn{0%{transform:scale(0.6);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
    @keyframes fadeSlideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
    @keyframes tabSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .tab-content{animation:tabSlide 0.22s ease both;}
    .fade-up{animation:fadeUp 0.4s ease both;}
  `}</style>
);

const P={
  cream:"#F2EDE4",amber:"#C17F3A",amberL:"#E8C46A",amberD:"#A0622A",
  blue:"#1B4F8A",blueD:"#14406E",blueL:"#EBF2FA",
  dark:"#2C2C2C",mid:"#6B6B6B",white:"#FFFFFF",
  green:"#3B6D11",greenL:"#EAF3DE",red:"#A32D2D",redL:"#FCEBEB",
  orange:"#B85C00",orangeL:"#FFF3E6",
};

const DEFAULT_TASKS=[
  {id:"meditation",type:"daily_binary",label:"Meditar",          icon:"🧘",days:["mon","tue","wed","thu","fri","sat","sun"]},
  {id:"exercise",  type:"daily_binary",label:"Ejercicio",        icon:"⚡",days:["mon","wed","fri","sat","sun"]},
  {id:"reading",   type:"daily_binary",label:"Leer",             icon:"📖",days:["mon","tue","wed","thu","fri","sat","sun"]},
  {id:"gratitude", type:"daily_binary",label:"Gratitud",         icon:"🌱",days:["mon","tue","wed","thu","fri","sat","sun"]},
  {id:"stoic",     type:"daily_binary",label:"Reflexión estoica",icon:"⚖️", days:["mon","tue","wed","thu","fri","sat","sun"]},
];

const DAYS_MAP   =["sun","mon","tue","wed","thu","fri","sat"];
const DAYS_LABELS={sun:"Dom",mon:"Lun",tue:"Mar",wed:"Mié",thu:"Jue",fri:"Vie",sat:"Sáb"};
const MONTH_NAMES=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTH_FULL =["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DOW_ES     =["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAY_ORDER  =["mon","tue","wed","thu","fri","sat","sun"];
const TYPE_LABELS={daily_binary:"Diaria",weekly_target:"Semanal (meta)",monthly_accumulative:"Mensual (meta)",flexible:"Flexible"};
const ICON_OPTIONS=["🧘","⚡","📖","🌱","⚖️","🏃","💧","🎯","✍️","🎵","🍎","😴","📌","🔥","💪","🧠","🌅","🌙","📝","❤️"];

function uid(){return Math.random().toString(36).slice(2,9);}
function toDateStr(d){return d.toISOString().split("T")[0];}
function todayStr(){return toDateStr(new Date());}
function yesterdayStr(){const d=new Date();d.setDate(d.getDate()-1);return toDateStr(d);}
function dayOfWeek(ds){return DAYS_MAP[new Date(ds+"T12:00:00").getDay()];}
function isValidDateStr(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;return !isNaN(new Date(s+"T12:00:00").getTime());}
function getLast7Days(){return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return toDateStr(d);});}
function getOrderedMonths(history){
  const dates=Object.keys(history).sort();
  const base=dates.length?dates[0].slice(0,7):todayStr().slice(0,7);
  const[y,m]=base.split("-").map(Number);
  return Array.from({length:12},(_,i)=>{const d=new Date(y,m-1+i,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
}
function getWeekStart(ds){const d=new Date(ds+"T12:00:00");d.setDate(d.getDate()-d.getDay());return toDateStr(d);}
function getMonthStr(ds){return ds.slice(0,7);}
function getTasksForDate(ds,tasks){
  const dow=dayOfWeek(ds);
  return tasks.filter(t=>{
    if(t.type==="daily_binary") return t.days&&t.days.includes(dow);
    if(t.type==="weekly_target"||t.type==="monthly_accumulative"||t.type==="flexible") return true;
    return false;
  });
}
function weeklyCount(taskId,ws,history){let c=0;for(let i=0;i<7;i++){const d=new Date(ws+"T12:00:00");d.setDate(d.getDate()+i);const ds=toDateStr(d);if(history[ds]&&history[ds][taskId]===true)c++;}return c;}
function monthlyCount(taskId,ms,history){return Object.keys(history).filter(ds=>ds.slice(0,7)===ms&&history[ds][taskId]===true).length;}

// ══════ PURE COMPUTE ══════
function computeCompletionForDate(ds,history,tasks){
  const entry=history[ds];if(!entry) return null;
  const dow=dayOfWeek(ds);
  const daily=tasks.filter(t=>t.type==="daily_binary"&&t.days&&t.days.includes(dow));
  if(!daily.length) return{pct:0,done:0,total:0};
  const done=daily.filter(t=>entry[t.id]===true).length;
  return{pct:Math.round((done/daily.length)*100),done,total:daily.length};
}
function computeWeeklyProgress(taskId,ds,history,task){
  const count=weeklyCount(taskId,getWeekStart(ds),history);
  return{count,target:task.weeklyTarget||1,met:count>=(task.weeklyTarget||1)};
}
function computeMonthlyProgress(taskId,ds,history,task){
  const count=monthlyCount(taskId,getMonthStr(ds),history);
  return{count,target:task.monthlyTarget||1,met:count>=(task.monthlyTarget||1)};
}
function computePerfectDays(history,tasks){return Object.keys(history).filter(ds=>{const c=computeCompletionForDate(ds,history,tasks);return c&&c.pct===100;}).length;}
function computeStreaks(history){
  const dates=Object.keys(history).sort();
  if(!dates.length) return{current:0,longest:0};
  let longest=1,streak=1;
  for(let i=1;i<dates.length;i++){const diff=(new Date(dates[i]+"T12:00:00")-new Date(dates[i-1]+"T12:00:00"))/86400000;if(diff===1)streak++;else{longest=Math.max(longest,streak);streak=1;}}
  longest=Math.max(longest,streak);
  const last=dates[dates.length-1];let current=0;
  if(last===todayStr()||last===yesterdayStr()){let cur=1;for(let i=dates.length-2;i>=0;i--){if((new Date(dates[i+1]+"T12:00:00")-new Date(dates[i]+"T12:00:00"))/86400000===1)cur++;else break;}current=cur;}
  return{current,longest};
}
function computeMonthlyStats(history,tasks){
  const months={};
  for(const ds of Object.keys(history)){
    const month=ds.slice(0,7);
    if(!months[month]) months[month]={totalPct:0,daysTracked:0,xp:0};
    const comp=computeCompletionForDate(ds,history,tasks);if(!comp) continue;
    months[month].totalPct+=comp.pct;months[month].daysTracked++;
    months[month].xp+=comp.done*10+(comp.pct===100?20:0);
  }
  const result={};
  for(const m of Object.keys(months)){const{totalPct,daysTracked,xp}=months[m];result[m]={avgCompletion:daysTracked?Math.round(totalPct/daysTracked):0,daysTracked,xp};}
  return result;
}
function computeMonthlyTier(s){const p=s.avgCompletion;if(p>=90)return"elite";if(p>=75)return"solido";if(p>=50)return"regular";return"critico";}
function computeMonthlyAdjustments(history,tasks){
  const stats=computeMonthlyStats(history,tasks),result={};
  for(const[m,s]of Object.entries(stats)){const tier=computeMonthlyTier(s),p=s.avgCompletion;let adj=0;if(tier==="elite")adj=200+Math.round((p-90)*5);else if(tier==="solido")adj=100;else if(tier==="regular")adj=p>=50?30:-50;else adj=-150;result[m]=adj;}
  return result;
}
function computeMonthlyConsistency(history,tasks){
  const stats=computeMonthlyStats(history,tasks),months=Object.keys(stats).sort(),result={};
  if(months.length) result[months[0]]=0;
  for(let i=1;i<months.length;i++){const diff=stats[months[i]].avgCompletion-stats[months[i-1]].avgCompletion;result[months[i]]=diff>=0?Math.round(diff*5):Math.round(diff*3);}
  return result;
}
function computeXP(history,tasks){
  let base=0;for(const ds of Object.keys(history)){const c=computeCompletionForDate(ds,history,tasks);if(c)base+=c.done*10+(c.pct===100?20:0);}
  const adj=Object.values(computeMonthlyAdjustments(history,tasks)).reduce((a,b)=>a+b,0);
  const con=Object.values(computeMonthlyConsistency(history,tasks)).reduce((a,b)=>a+b,0);
  return Math.max(0,base+adj+con);
}
function computeBadges(history,tasks){
  const{current,longest}=computeStreaks(history);
  const totalXP=computeXP(history,tasks),totalDays=Object.keys(history).length,perfectDays=computePerfectDays(history,tasks);
  const stats=computeMonthlyStats(history,tasks),months=Object.keys(stats).sort();
  const eliteMonths=months.filter(m=>computeMonthlyTier(stats[m])==="elite").length;
  let maxConsec75=0,consec75=0;for(const m of months){if(stats[m].avgCompletion>=75){consec75++;maxConsec75=Math.max(maxConsec75,consec75);}else consec75=0;}
  const def=(id,label,icon,type,unlocked)=>({id,label,icon,type,unlocked});
  return[def("streak_3","Racha 3 días","🔥","streak",current>=3||longest>=3),def("streak_7","Racha 7 días","⚡","streak",current>=7||longest>=7),def("streak_14","Racha 14 días","💎","streak",current>=14||longest>=14),def("streak_30","Racha 30 días","🌊","streak",current>=30||longest>=30),def("streak_60","Racha 60 días","👑","streak",current>=60||longest>=60),def("days_7","7 días registrados","📅","acumulativo",totalDays>=7),def("days_30","30 días registrados","🗓️","acumulativo",totalDays>=30),def("days_100","100 días registrados","📆","acumulativo",totalDays>=100),def("xp_500","500 XP","⭐","xp",totalXP>=500),def("xp_2000","2000 XP","🌟","xp",totalXP>=2000),def("perfect_1","1 día perfecto","💯","perfeccion",perfectDays>=1),def("perfect_5","5 días perfectos","🏅","perfeccion",perfectDays>=5),def("perfect_20","20 días perfectos","🏆","perfeccion",perfectDays>=20),def("elite_1","1 mes élite","🥇","mensual",eliteMonths>=1),def("elite_3","3 meses élite","🎖️","mensual",eliteMonths>=3),def("consec_75_3","3 meses ≥75% seguidos","🔗","consistencia",maxConsec75>=3)];
}

// ══════════════════════════════════════════════════════════════
// FASE 9 — INSIGHTS ENGINE
// ══════════════════════════════════════════════════════════════

function computeInsights(history, tasks) {
  const dates = Object.keys(history).filter(isValidDateStr).sort();
  if (dates.length < 3) return { insights: [], recommendations: [], taskStats: [], dayStats: [] };

  const insights = [];
  const recommendations = [];

  const taskStats = tasks.map(task => {
    const applicable = dates.filter(ds => getTasksForDate(ds, [task]).length > 0);
    if (!applicable.length) return { task, rate: 0, count: 0, total: 0 };
    const done = applicable.filter(ds => history[ds] && history[ds][task.id] === true).length;
    return { task, rate: Math.round((done / applicable.length) * 100), count: done, total: applicable.length };
  }).sort((a, b) => b.rate - a.rate);

  const best = taskStats[0];
  const worst = taskStats[taskStats.length - 1];

  if (best && best.rate >= 80 && best.total >= 5) {
    insights.push({ type: "positive", category: "tarea", icon: "⭐", message: `Alta consistencia en "${best.task.label}"`, detail: `${best.rate}% de cumplimiento (${best.count}/${best.total} días)` });
  }
  if (worst && worst.rate < 50 && worst.total >= 5) {
    insights.push({ type: "warning", category: "tarea", icon: "⚠️", message: `"${worst.task.label}" es tu tarea más evitada`, detail: `Solo ${worst.rate}% de cumplimiento (${worst.count}/${worst.total} días)` });
    recommendations.push({ icon: "🔧", message: `Considera ajustar la frecuencia o el momento del día para "${worst.task.label}".` });
  }

  const dayBuckets = {};
  DAYS_MAP.forEach(d => { dayBuckets[d] = { total: 0, sumPct: 0 }; });
  dates.forEach(ds => {
    const comp = computeCompletionForDate(ds, history, tasks);
    if (!comp) return;
    const dow = dayOfWeek(ds);
    dayBuckets[dow].total++;
    dayBuckets[dow].sumPct += comp.pct;
  });
  const dayStats = DAYS_MAP.map(d => ({
    dow: d, label: DAYS_LABELS[d],
    avg: dayBuckets[d].total > 0 ? Math.round(dayBuckets[d].sumPct / dayBuckets[d].total) : null,
    count: dayBuckets[d].total,
  })).filter(d => d.avg !== null);

  if (dayStats.length >= 3) {
    const sorted = [...dayStats].sort((a, b) => b.avg - a.avg);
    const strongest = sorted[0], weakest = sorted[sorted.length - 1];
    if (strongest.avg >= 80) insights.push({ type: "positive", category: "día", icon: "📅", message: `Los ${strongest.label} son tu día más fuerte`, detail: `${strongest.avg}% promedio de cumplimiento` });
    if (weakest.avg < 50 && weakest.count >= 2) {
      insights.push({ type: "critical", category: "día", icon: "🔴", message: `Los ${weakest.label} son tu día más débil`, detail: `${weakest.avg}% promedio — revisa qué ocurre ese día` });
      recommendations.push({ icon: "📆", message: `Los ${weakest.label} tienen bajo rendimiento. Considera reducir exigencia o agregar una rutina ancla ese día.` });
    }
    const gap = strongest.avg - weakest.avg;
    if (gap > 40 && dayStats.length >= 4) {
      insights.push({ type: "warning", category: "consistencia", icon: "📊", message: `Alta variabilidad entre días de la semana`, detail: `${gap} puntos de diferencia entre ${strongest.label} (${strongest.avg}%) y ${weakest.label} (${weakest.avg}%)` });
      recommendations.push({ icon: "⚖️", message: `Tu rendimiento es muy irregular. Prioriza una rutina mínima para los días débiles en lugar de esfuerzo máximo solo en los buenos.` });
    }
  }

  const mStats = computeMonthlyStats(history, tasks);
  const mKeys = Object.keys(mStats).sort();
  if (mKeys.length >= 2) {
    const recent = mKeys.slice(-2), prev = mStats[recent[0]].avgCompletion, curr = mStats[recent[1]].avgCompletion, diff = curr - prev;
    if (diff >= 10) insights.push({ type: "positive", category: "tendencia", icon: "📈", message: `Tendencia positiva este mes`, detail: `+${diff} puntos vs mes anterior (${prev}% → ${curr}%)` });
    else if (diff <= -10) { insights.push({ type: "critical", category: "tendencia", icon: "📉", message: `Tendencia negativa este mes`, detail: `${diff} puntos vs mes anterior (${prev}% → ${curr}%)` }); recommendations.push({ icon: "🔁", message: `Tu rendimiento cayó ${Math.abs(diff)} puntos este mes. Identifica qué cambió en tu rutina y reestablece lo básico.` }); }
    else insights.push({ type: "positive", category: "tendencia", icon: "➡️", message: `Rendimiento estable entre meses`, detail: `${prev}% → ${curr}% (variación de ${diff > 0 ? "+" : ""}${diff} puntos)` });
  }

  if (mKeys.length >= 3) {
    const avgs = mKeys.map(m => mStats[m].avgCompletion);
    const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length;
    const stdDev = Math.round(Math.sqrt(avgs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / avgs.length));
    if (stdDev < 10) insights.push({ type: "positive", category: "estabilidad", icon: "🎯", message: `Rendimiento mensual muy estable`, detail: `Desviación estándar de solo ${stdDev} puntos entre meses` });
    else if (stdDev > 25) { insights.push({ type: "warning", category: "estabilidad", icon: "🌊", message: `Rendimiento mensual muy variable`, detail: `Desviación estándar de ${stdDev} puntos — falta consistencia estructural` }); recommendations.push({ icon: "🧱", message: `Tu rendimiento fluctúa mucho entre meses. Define un "mínimo no negociable" de tareas diarias para estabilizar la base.` }); }
  }

  const { current, longest } = computeStreaks(history);
  if (current >= 7) insights.push({ type: "positive", category: "racha", icon: "🔥", message: `Racha activa de ${current} días`, detail: `Estás en tu mejor momento de consistencia` });
  else if (current === 0 && dates.length > 7) { insights.push({ type: "critical", category: "racha", icon: "💔", message: `Racha interrumpida`, detail: `El último registro fue hace más de un día — retoma hoy` }); recommendations.push({ icon: "🚀", message: `Reinicia la racha hoy. No esperes el momento perfecto — un registro parcial es mejor que ninguno.` }); }
  if (longest > 0 && current < longest * 0.5 && longest >= 7) insights.push({ type: "warning", category: "racha", icon: "🔁", message: `Estás muy por debajo de tu mejor racha`, detail: `Racha actual: ${current} días vs mejor: ${longest} días` });

  tasks.filter(t => t.type === "daily_binary").forEach(task => {
    let streak = 0;
    const applicable = dates.filter(ds => getTasksForDate(ds, [task]).length > 0);
    for (let i = applicable.length - 1; i >= 0; i--) {
      if (history[applicable[i]]?.[task.id] === true) { streak++; } else { if (i === applicable.length - 1) streak = 0; else break; }
    }
    if (streak >= 7) insights.push({ type: "positive", category: "tarea", icon: "⚡", message: `"${task.label}" lleva ${streak} días seguidos`, detail: `Excelente racha en esta tarea específica` });
  });

  tasks.filter(t => t.type === "weekly_target" || t.type === "monthly_accumulative").forEach(task => {
    const recentMonths = mKeys.slice(-2);
    recentMonths.forEach(m => {
      const count = monthlyCount(task.id, m, history);
      const target = task.type === "monthly_accumulative" ? (task.monthlyTarget || 1) : ((task.weeklyTarget || 1) * 4);
      if (count < target * 0.5 && mStats[m] && mStats[m].daysTracked >= 10) {
        insights.push({ type: "warning", category: "meta", icon: "🎯", message: `Incumpliendo meta de "${task.label}"`, detail: `${count} registros en ${MONTH_NAMES[parseInt(m.split("-")[1],10)-1]}, esperado ~${target}` });
        recommendations.push({ icon: "📉", message: `La meta de "${task.label}" está muy lejos. Considera reducir el objetivo temporalmente para recuperar el hábito.` });
      }
    });
  });

  const allComps = dates.map(ds => computeCompletionForDate(ds, history, tasks)).filter(Boolean);
  const overallAvg = allComps.length ? Math.round(allComps.reduce((a, c) => a + c.pct, 0) / allComps.length) : 0;
  if (overallAvg >= 85 && dates.length >= 14) insights.push({ type: "positive", category: "global", icon: "🏆", message: `Rendimiento global excelente`, detail: `${overallAvg}% de promedio en ${dates.length} días registrados` });
  else if (overallAvg < 40 && dates.length >= 7) { insights.push({ type: "critical", category: "global", icon: "⚡", message: `Rendimiento global bajo`, detail: `${overallAvg}% promedio — considera simplificar las tareas activas` }); recommendations.push({ icon: "🗂️", message: `Tu promedio global es bajo. Reduce el número de tareas activas y enfócate en construir el hábito base primero.` }); }

  return { insights, recommendations, taskStats, dayStats, overallAvg, dates };
}

// ══════════════════════════════════════════════════════════════
// FASE 13 — PRIORITY ENGINE + EXTENDED INSIGHTS
// ══════════════════════════════════════════════════════════════

function computePriorityTasks(history, tasks) {
  const dates = Object.keys(history).filter(isValidDateStr).sort();
  if (!dates.length) return [];
  const today = todayStr();
  return tasks.map(task => {
    const applicable = dates.filter(ds => getTasksForDate(ds, [task]).length > 0);
    if (!applicable.length) return { task, priority: "verde", score: 0, reasons: [] };
    const done = applicable.filter(ds => history[ds]?.[task.id] === true).length;
    const failRate = 1 - (done / applicable.length);
    const lastDone = [...applicable].reverse().find(ds => history[ds]?.[task.id] === true);
    const daysSinceDone = lastDone ? Math.round((new Date(today+"T12:00:00") - new Date(lastDone+"T12:00:00")) / 86400000) : 999;
    const missedXP = Math.round(failRate * applicable.length * 10);
    const reasons = []; let score = 0;
    if (failRate > 0.5) { score += 3; reasons.push(`Fallas el ${Math.round(failRate*100)}% de los días aplicables`); }
    else if (failRate > 0.3) { score += 1; reasons.push(`Fallas el ${Math.round(failRate*100)}% de los días`); }
    if (daysSinceDone >= 7 && applicable.length >= 3) { score += 3; reasons.push(`Sin completar en ${daysSinceDone} días`); }
    else if (daysSinceDone >= 4) { score += 1; reasons.push(`Sin completar en ${daysSinceDone} días`); }
    if (missedXP >= 50) { score += 2; reasons.push(`~${missedXP} XP perdido por fallos`); }
    const priority = score >= 5 ? "roja" : score >= 2 ? "amarilla" : "verde";
    return { task, priority, score, failRate, daysSinceDone, missedXP, applicable: applicable.length, done, reasons };
  }).sort((a, b) => b.score - a.score);
}

function computeExtendedInsights(history, tasks) {
  const base = computeInsights(history, tasks);
  const dates = Object.keys(history).filter(isValidDateStr).sort();
  if (dates.length < 3) return base;
  const extra = [], extraRecs = [], today = todayStr();

  const last14 = dates.filter(ds => (new Date(today+"T12:00:00") - new Date(ds+"T12:00:00")) / 86400000 <= 14);
  tasks.forEach(task => {
    const applicable14 = last14.filter(ds => getTasksForDate(ds,[task]).length > 0);
    if (applicable14.length < 3) return;
    const done14 = applicable14.filter(ds => history[ds]?.[task.id] === true).length;
    if (done14 === 0) {
      extra.push({ type:"critical", category:"abandono", icon:"🚫", message:`"${task.label}" no se ha completado en 14 días`, detail:`${applicable14.length} días aplicables sin ningún registro positivo` });
      extraRecs.push({ icon:"🔁", message:`Reconsidera si "${task.label}" sigue siendo relevante, o simplifica su condición de cumplimiento.` });
    }
  });

  const allComps = dates.map(ds => computeCompletionForDate(ds, history, tasks)).filter(Boolean);
  const globalAvg = allComps.length ? Math.round(allComps.reduce((a,c) => a+c.pct, 0) / allComps.length) : 0;
  const activeDailyTasks = tasks.filter(t => t.type === "daily_binary");
  if (activeDailyTasks.length >= 6 && globalAvg < 50) {
    extra.push({ type:"critical", category:"sobrecarga", icon:"⚠️", message:`Posible sobrecarga: ${activeDailyTasks.length} tareas diarias con ${globalAvg}% de cumplimiento`, detail:"Demasiadas tareas activas pueden reducir la adherencia total" });
    extraRecs.push({ icon:"✂️", message:`Considera reducir a 4–5 tareas diarias. Más tareas con bajo cumplimiento generan menos hábito que pocas tareas cumplidas consistentemente.` });
  }

  const dowBuckets = {};
  DAYS_MAP.forEach(d => { dowBuckets[d] = { total:0, sumPct:0 }; });
  dates.forEach(ds => {
    const comp = computeCompletionForDate(ds, history, tasks); if (!comp) return;
    const dow = dayOfWeek(ds); dowBuckets[dow].total++; dowBuckets[dow].sumPct += comp.pct;
  });
  DAYS_MAP.forEach(dow => {
    const b = dowBuckets[dow]; if (b.total < 3) return;
    const avg = Math.round(b.sumPct / b.total);
    if (avg < 40) {
      extra.push({ type:"warning", category:"día recurrente", icon:"📌", message:`Los ${DAYS_LABELS[dow]} son sistemáticamente críticos`, detail:`Promedio de ${avg}% en ${b.total} ocurrencias — patrón establecido` });
      extraRecs.push({ icon:"🔧", message:`Los ${DAYS_LABELS[dow]} muestran bajo rendimiento constante. Define UNA tarea mínima obligatoria para ese día y elimina el resto temporalmente.` });
    }
  });

  tasks.filter(t => t.type === "monthly_accumulative").forEach(task => {
    const mStats = computeMonthlyStats(history, tasks);
    const recentMonths = Object.keys(mStats).sort().slice(-2);
    let unclosedCount = 0;
    recentMonths.forEach(m => { if (monthlyCount(task.id, m, history) < (task.monthlyTarget || 1)) unclosedCount++; });
    if (unclosedCount >= 2) {
      extra.push({ type:"warning", category:"meta mensual", icon:"🎯", message:`Meta mensual "${task.label}" sin cerrar 2 meses seguidos`, detail:`Objetivo: ${task.monthlyTarget || 1} veces/mes — no se está alcanzando` });
      extraRecs.push({ icon:"📉", message:`La meta de "${task.label}" lleva 2 meses sin cerrarse. Reduce el objetivo a ${Math.max(1, (task.monthlyTarget||1)-1)} para recuperar el ritmo.` });
    }
  });

  return { ...base, insights: [...extra, ...base.insights], recommendations: [...extraRecs, ...base.recommendations] };
}

function detectDataIssues(history, tasks) {
  const issues = [];
  if (!history || typeof history !== "object") return { hasIssues: true, issues: [{ msg: "Historial inválido." }] };
  const todayMs = new Date(todayStr() + "T12:00:00").getTime();
  Object.keys(history).forEach(k => {
    if (!isValidDateStr(k)) { issues.push({ msg: `Fecha inválida: "${k}"` }); return; }
    if (new Date(k + "T12:00:00").getTime() > todayMs + 86400000) { issues.push({ msg: `Fecha futura: "${k}"` }); return; }
    const e = history[k];
    if (!e || typeof e !== "object") { issues.push({ msg: `Registro corrupto en "${k}"` }); return; }
    Object.entries(e).forEach(([f, v]) => { if (typeof v !== "boolean") issues.push({ msg: `Valor inválido en "${k}.${f}"` }); });
  });
  return { hasIssues: issues.length > 0, issues };
}
function repairHistory(history, tasks) {
  if (!history || typeof history !== "object") return {};
  const today = todayStr(), repaired = {};
  Object.entries(history).forEach(([k, entry]) => {
    if (!isValidDateStr(k)) return;
    if (new Date(k + "T12:00:00").getTime() > new Date(today + "T12:00:00").getTime() + 86400000) return;
    if (!entry || typeof entry !== "object") return;
    const clean = {};
    Object.entries(entry).forEach(([f, v]) => { clean[f] = Boolean(v); });
    repaired[k] = clean;
  });
  return repaired;
}

const H_KEY = "porta_virtus_history", T_KEY = "porta_virtus_tasks", U_KEY = "porta_virtus_user";
async function loadData() {
  let history = {}, tasks = null, user = null;
  try { if (window.storage) { const r = await window.storage.get(H_KEY); if (r) history = JSON.parse(r.value); } } catch {}
  try { if (!Object.keys(history).length) { const r = localStorage.getItem(H_KEY); if (r) history = JSON.parse(r); } } catch {}
  try { if (window.storage) { const r = await window.storage.get(T_KEY); if (r) tasks = JSON.parse(r.value); } } catch {}
  try { if (!tasks) { const r = localStorage.getItem(T_KEY); if (r) tasks = JSON.parse(r); } } catch {}
  try { if (window.storage) { const r = await window.storage.get(U_KEY); if (r) user = JSON.parse(r.value); } } catch {}
  try { if (!user) { const r = localStorage.getItem(U_KEY); if (r) user = JSON.parse(r); } } catch {}
  return { history: history || {}, tasks: tasks || null, user: user || null };
}
async function saveData(history, tasks, user) {
  const hs = JSON.stringify(history), ts = JSON.stringify(tasks), us = JSON.stringify(user);
  try { if (window.storage) { await window.storage.set(H_KEY, hs); await window.storage.set(T_KEY, ts); await window.storage.set(U_KEY, us); return; } } catch {}
  try { localStorage.setItem(H_KEY, hs); localStorage.setItem(T_KEY, ts); localStorage.setItem(U_KEY, us); } catch {}
}

const TIER = {
  elite: { label: "Élite", color: P.amber, bg: "#FDF6EC", icon: "👑" },
  solido: { label: "Sólido", color: P.blue, bg: P.blueL, icon: "⚡" },
  regular: { label: "Regular", color: "#7A6020", bg: "#FBF5E6", icon: "🔸" },
  critico: { label: "Crítico", color: P.red, bg: P.redL, icon: "⚠️" },
};

function pctColor(p) { return p === 100 ? P.green : p >= 75 ? P.amber : p >= 50 ? "#7A6020" : P.red; }
const MiniBar = ({ pct, color = P.amber, height = 4 }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 30); return () => clearTimeout(t); }, []);
  return (<div style={{ width: "100%", background: P.cream, borderRadius: height, height, overflow: "hidden" }}><div style={{ height, background: color, borderRadius: height, width: show ? `${pct}%` : "0%", transition: "width 0.65s cubic-bezier(.4,0,.2,1)" }} /></div>);
};
const Chip = ({ label, value, color = P.dark }) => (<div style={{ background: P.cream, borderRadius: 10, padding: "10px 12px", textAlign: "center", flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600, color, fontFamily: "'Inter',sans-serif" }}>{value}</div><div style={{ fontSize: 10, color: P.mid, marginTop: 2 }}>{label}</div></div>);
const TierPill = ({ tier }) => { const t = TIER[tier]; return (<span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: t.bg, color: t.color, border: `1px solid ${t.color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}><span style={{ fontSize: 11 }}>{t.icon}</span>{t.label}</span>); };
const Divider = () => (<div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}><div style={{ flex: 1, height: 1, background: `linear-gradient(to right,transparent,${P.amber}66)` }} /><div style={{ width: 4, height: 4, borderRadius: "50%", background: P.amber, opacity: 0.6 }} /><div style={{ flex: 1, height: 1, background: `linear-gradient(to left,transparent,${P.amber}66)` }} /></div>);
const SectionLabel = ({children}) => (<div style={{fontSize:10,fontWeight:600,color:P.mid,letterSpacing:1.5,textTransform:"uppercase",padding:"4px 0 8px"}}>{children}</div>);
const EmptyState = ({icon, title, sub, action, onAction}) => (<div className="fade-up" style={{background:P.white,borderRadius:14,padding:"28px 20px",textAlign:"center",border:`1px dashed ${P.amber}44`,marginBottom:12}}><div style={{fontSize:28,marginBottom:10}}>{icon}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:P.dark,marginBottom:6}}>{title}</div>{sub&&<div style={{fontSize:13,color:P.mid,marginBottom:action?18:0,lineHeight:1.5}}>{sub}</div>}{action&&onAction&&<Btn variant="primary" onClick={onAction}>{action}</Btn>}</div>);

function Btn({ variant = "primary", onClick, children, style = {}, disabled = false }) {
  const [hov, setHov] = useState(false), [act, setAct] = useState(false);
  const base = variant === "primary" ? { background: `linear-gradient(135deg,${P.blue},${P.blueD})`, color: P.white, border: "none", borderRadius: 10, padding: "11px 18px", fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" } : variant === "danger" ? { background: "transparent", color: P.red, border: `1.5px solid ${P.red}55`, borderRadius: 10, padding: "8px 14px", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" } : variant === "outline" ? { background: "transparent", color: P.blue, border: `1.5px solid ${P.blue}55`, borderRadius: 10, padding: "10px 18px", fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" } : { background: "transparent", color: P.mid, border: "none", borderRadius: 8, padding: "6px 12px", fontFamily: "'Inter',sans-serif", fontSize: 13, cursor: "pointer" };
  return (<button disabled={disabled} style={{ ...base, ...style, filter: hov && !disabled ? "brightness(1.1)" : "brightness(1)", transform: act ? "scale(0.97)" : "scale(1)", opacity: disabled ? 0.5 : 1, transition: "transform 0.12s,filter 0.18s" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setAct(false); }} onMouseDown={() => setAct(true)} onMouseUp={() => setAct(false)} onClick={onClick}>{children}</button>);
}

function DataStatusIndicator({ history, tasks }) {
  const { hasIssues, issues } = detectDataIssues(history, tasks);
  const [show, setShow] = useState(false);
  return (<div style={{ position: "relative" }}><button onClick={() => setShow(s => !s)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 6 }}><span style={{ fontSize: 9 }}>{hasIssues ? "⚠️" : "✅"}</span><span style={{ fontSize: 9, color: hasIssues ? P.orange : P.green, fontWeight: 600 }}>{hasIssues ? `${issues.length} issue${issues.length > 1 ? "s" : ""}` : "OK"}</span></button>{show && (<div style={{ position: "absolute", bottom: 24, right: 0, background: P.white, border: `1px solid ${P.cream}`, borderRadius: 10, padding: 12, minWidth: 220, zIndex: 100, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", animation: "popIn 0.2s ease both" }}><div style={{ fontSize: 11, fontWeight: 600, color: P.dark, marginBottom: 6 }}>{hasIssues ? "Inconsistencias" : "Datos consistentes"}</div>{!hasIssues ? <div style={{ fontSize: 11, color: P.green }}>✓ Sin problemas.</div> : issues.slice(0, 5).map((is, i) => (<div key={i} style={{ fontSize: 10, color: P.orange, marginBottom: 3, borderLeft: `2px solid ${P.orange}`, paddingLeft: 6 }}>{is.msg}</div>))}<button style={{ background: "none", border: "none", fontSize: 10, color: P.mid, cursor: "pointer", marginTop: 6 }} onClick={() => setShow(false)}>cerrar</button></div>)}</div>);
}

function DebugPanel({ history, tasks, onClose }) {
  const totalXP = computeXP(history, tasks), { current, longest } = computeStreaks(history);
  const stats = computeMonthlyStats(history, tasks), badges = computeBadges(history, tasks);
  const { hasIssues, issues } = detectDataIssues(history, tasks);
  useEffect(() => { function onKey(e) { if (e.ctrlKey && e.key === "d") { e.preventDefault(); onClose(); } } window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}><div style={{ background: "#1A1A2E", color: "#E0E0E0", borderRadius: 14, padding: 20, maxWidth: 420, width: "90%", fontFamily: "'Inter',sans-serif", fontSize: 12, maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><span style={{ fontSize: 11, letterSpacing: 2, color: "#7099B8", fontWeight: 600 }}>PORTA VIRTUS — DEBUG</span><button style={{ background: "none", border: "none", color: "#7099B8", cursor: "pointer", fontSize: 16 }} onClick={onClose}>✕</button></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>{[["Días", Object.keys(history).length], ["XP", totalXP], ["Racha", current], ["Racha máx.", longest], ["Meses", Object.keys(stats).length], ["Insignias", `${badges.filter(b => b.unlocked).length}/${badges.length}`], ["Tareas", tasks.length]].map(([l, v]) => (<div key={l} style={{ background: "#252540", borderRadius: 8, padding: "8px 10px" }}><div style={{ color: "#7099B8", fontSize: 10, marginBottom: 2 }}>{l}</div><div style={{ color: P.amberL, fontWeight: 600, fontSize: 14 }}>{v}</div></div>))}</div><div style={{ background: "#252540", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}><div style={{ color: "#7099B8", fontSize: 10, marginBottom: 6, letterSpacing: 1 }}>INTEGRIDAD</div>{!hasIssues ? <div style={{ color: "#5DBB7A", fontSize: 12 }}>✓ Sin problemas</div> : issues.map((is, i) => (<div key={i} style={{ color: "#F5A623", fontSize: 11, marginBottom: 3, borderLeft: "2px solid #F5A623", paddingLeft: 6 }}>{is.msg}</div>))}</div><div style={{ background: "#252540", borderRadius: 8, padding: "10px 12px" }}><div style={{ color: "#7099B8", fontSize: 10, marginBottom: 6, letterSpacing: 1 }}>TAREAS</div>{tasks.map(t => (<div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #333355", fontSize: 11 }}><span style={{ color: "#A8C4E0" }}>{t.label}</span><span style={{ color: P.amberL }}>{TYPE_LABELS[t.type]}</span></div>))}</div><div style={{ marginTop: 12, color: "#444466", fontSize: 10, textAlign: "center" }}>Ctrl+D para cerrar</div></div></div>);
}

function PerfectDayOverlay({ onDone }) {
  const [phase, setPhase] = useState("in");
  useEffect(() => { const t1 = setTimeout(() => setPhase("stay"), 600); const t2 = setTimeout(() => setPhase("out"), 2600); const t3 = setTimeout(() => onDone(), 3200); return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }; }, []);
  const anim = phase === "in" ? "bounceIn 0.6s cubic-bezier(.34,1.56,.64,1) both" : phase === "out" ? "slideUp 0.5s ease forwards" : "none";
  const Wreath = () => (<svg width="200" height="100" viewBox="0 0 200 100" fill="none"><path d="M88,82 C62,72 22,48 14,10" stroke="#7A4E1A" strokeWidth="1.5" fill="none" strokeLinecap="round" /><path d="M76,70 C68,62 63,56 69,50 C75,57 78,64 76,70Z" fill="#C17F3A" opacity="0.95" /><path d="M80,66 C89,60 93,54 87,48 C81,54 78,61 80,66Z" fill="#D4963F" opacity="0.80" /><path d="M57,56 C48,47 44,41 51,35 C58,41 62,49 57,56Z" fill="#C17F3A" opacity="0.92" /><path d="M62,51 C72,43 75,37 68,31 C61,37 58,45 62,51Z" fill="#E8C46A" opacity="0.72" /><path d="M39,40 C30,30 27,24 35,18 C42,24 45,32 39,40Z" fill="#C17F3A" opacity="1" /><path d="M44,35 C54,26 57,20 49,14 C42,19 40,28 44,35Z" fill="#D4963F" opacity="0.82" /><path d="M35,36 C26,30 23,26 30,21 C36,26 38,32 35,36Z" fill="#E8C46A" opacity="0.65" /><path d="M23,24 C16,15 15,10 22,5 C28,10 29,18 23,24Z" fill="#C17F3A" opacity="0.88" /><ellipse cx="72" cy="65" rx="2.4" ry="1.7" fill="#A0622A" transform="rotate(-35 72 65)" /><ellipse cx="50" cy="47" rx="2.2" ry="1.6" fill="#A0622A" opacity="0.88" transform="rotate(-55 50 47)" /><ellipse cx="32" cy="29" rx="2.0" ry="1.5" fill="#A0622A" opacity="0.80" transform="rotate(-70 32 29)" /><path d="M112,82 C138,72 178,48 186,10" stroke="#7A4E1A" strokeWidth="1.5" fill="none" strokeLinecap="round" /><path d="M124,70 C132,62 137,56 131,50 C125,57 122,64 124,70Z" fill="#C17F3A" opacity="0.93" /><path d="M120,66 C111,60 107,54 113,48 C119,54 122,61 120,66Z" fill="#D4963F" opacity="0.78" /><path d="M143,56 C152,47 156,41 149,35 C142,41 138,49 143,56Z" fill="#C17F3A" opacity="0.90" /><path d="M138,51 C128,43 125,37 132,31 C139,37 142,45 138,51Z" fill="#E8C46A" opacity="0.68" /><path d="M161,40 C170,30 173,24 165,18 C158,24 155,32 161,40Z" fill="#C17F3A" opacity="0.97" /><path d="M156,35 C146,26 143,20 151,14 C158,19 160,28 156,35Z" fill="#D4963F" opacity="0.80" /><path d="M165,36 C174,30 177,26 170,21 C164,26 162,32 165,36Z" fill="#E8C46A" opacity="0.62" /><path d="M177,24 C184,15 185,10 178,5 C172,10 171,18 177,24Z" fill="#C17F3A" opacity="0.85" /><ellipse cx="128" cy="65" rx="2.4" ry="1.7" fill="#A0622A" transform="rotate(35 128 65)" /><ellipse cx="150" cy="47" rx="2.2" ry="1.6" fill="#A0622A" opacity="0.88" transform="rotate(55 150 47)" /><ellipse cx="168" cy="29" rx="2.0" ry="1.5" fill="#A0622A" opacity="0.80" transform="rotate(70 168 29)" /><path d="M88,82 C93,90 107,90 112,82" stroke="#7A4E1A" strokeWidth="2" fill="none" strokeLinecap="round" /><path d="M92,83 C96,90 104,90 108,83" stroke="#C17F3A" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" /></svg>);
  return (<div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(27,79,138,0.55)", zIndex: 1000, animation: phase === "in" ? "fadeIn 0.3s ease both" : "none" }}><div style={{ background: P.white, borderRadius: 20, padding: "32px 40px", textAlign: "center", border: `2px solid ${P.amber}55`, boxShadow: "0 8px 40px rgba(0,0,0,0.2)", animation: anim, minWidth: 220 }}><Wreath /><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, letterSpacing: 4, color: P.blue, marginTop: 8, fontWeight: 300 }}>ἈΡΕΤΉ</div><div style={{ fontSize: 52, fontWeight: 700, background: `linear-gradient(135deg,${P.amberL},${P.amber})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, margin: "4px 0" }}>100%</div><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, letterSpacing: 3, color: P.blue, fontWeight: 400 }}>DÍA PERFECTO</div></div></div>);
}

function CheckinSummary({ comp, xp, onClose }) {
  return (<div style={{ background: P.white, borderRadius: 14, border: `1px solid ${P.amber}44`, padding: "20px 20px 16px", animation: "popIn 0.3s cubic-bezier(.34,1.56,.64,1) both" }}>
    <div style={{ textAlign: "center", marginBottom: 12 }}>
      <div style={{ fontSize: 46, fontWeight: 700, background: `linear-gradient(135deg,${pctColor(comp.pct)},${pctColor(comp.pct)}aa)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{comp.pct}%</div>
      <div style={{ fontSize: 13, color: P.mid, marginTop: 4 }}>{comp.done} de {comp.total} tareas · <span style={{ color: P.amber, fontWeight: 600 }}>+{xp} XP</span></div>
    </div>
    <MiniBar pct={comp.pct} color={pctColor(comp.pct)} height={7} />
    <Btn variant="primary" style={{ width: "100%", marginTop: 14 }} onClick={onClose}>Continuar</Btn>
  </div>);
}

function CheckinFlow({ dateStr, initialAnswers, onComplete, onCancel, tasks, history }) {
  const relevant = getTasksForDate(dateStr, tasks);
  const [answers, setAnswers] = useState(() => {
    const init = initialAnswers || {};
    const a = {};
    relevant.forEach(t => { a[t.id] = t.id in init ? init[t.id] : null; });
    return a;
  });
  const [showSummary, setShowSummary] = useState(false), [summaryData, setSummaryData] = useState(null);

  function getContext(task) {
    if (task.type === "weekly_target") { const ws = getWeekStart(dateStr); const h2 = { ...history, [dateStr]: Object.fromEntries(Object.entries(answers).filter(([,v]) => v !== null)) }; return `${weeklyCount(task.id, ws, h2)} / ${task.weeklyTarget || 1} esta semana`; }
    if (task.type === "monthly_accumulative") { const h2 = { ...history, [dateStr]: Object.fromEntries(Object.entries(answers).filter(([,v]) => v !== null)) }; return `${monthlyCount(task.id, getMonthStr(dateStr), h2)} / ${task.monthlyTarget || 1} este mes`; }
    return null;
  }
  function toggle(id) { setAnswers(a => ({ ...a, [id]: a[id] === true ? false : true })); }
  const answered = relevant.filter(t => answers[t.id] !== null).length;
  const allAnswered = answered === relevant.length;

  function handleFinish() {
    const final = {};
    relevant.forEach(t => { final[t.id] = answers[t.id] === true; });
    const tempHistory = { ...history, [dateStr]: final };
    const comp = computeCompletionForDate(dateStr, tempHistory, tasks) || { pct: 0, done: 0, total: 0 };
    const xp = Object.values(final).filter(Boolean).length * 10 + (comp.pct === 100 ? 20 : 0);
    setSummaryData({ comp, xp, finalAnswers: final });
    setShowSummary(true);
  }

  if (!relevant.length) return (<div style={{ padding: "12px 0" }}><p style={{ color: P.mid, fontSize: 14 }}>Sin tareas para este día.</p><Btn variant="ghost" onClick={onCancel}>Volver</Btn></div>);
  if (showSummary && summaryData) return (<CheckinSummary comp={summaryData.comp} xp={summaryData.xp} onClose={() => onComplete(summaryData.finalAnswers)} />);

  const groups = [
    { key: "daily_binary", label: "Diarias" },
    { key: "weekly_target", label: "Semanales" },
    { key: "monthly_accumulative", label: "Mensuales" },
    { key: "flexible", label: "Flexibles" },
  ].map(g => ({ ...g, items: relevant.filter(t => t.type === g.key) })).filter(g => g.items.length > 0);

  return (<div style={{ background: P.white, borderRadius: 14, border: `1px solid ${P.amber}33`, overflow: "hidden" }}>
    <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${P.cream}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: P.mid }}>{initialAnswers ? "Editando" : "Check-in"} · {dateStr}</span>
      <span style={{ fontSize: 12, color: P.amber, fontWeight: 600 }}>{answered} / {relevant.length} respondidas</span>
    </div>
    <MiniBar pct={(answered / relevant.length) * 100} color={P.amber} height={3} />
    <div style={{ padding: "8px 0" }}>
      {groups.map(g => (<div key={g.key}>
        {groups.length > 1 && <div style={{ fontSize: 10, color: P.mid, fontWeight: 600, letterSpacing: 1, padding: "6px 16px 2px", textTransform: "uppercase" }}>{g.label}</div>}
        {g.items.map(t => {
          const val = answers[t.id], ctx = getContext(t);
          const bg = val === true ? `${P.green}0F` : val === false ? "#F9F9F9" : P.white;
          return (<button key={t.id} onClick={() => toggle(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: bg, border: "none", borderBottom: `1px solid ${P.cream}`, cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${val === true ? P.green : val === false ? P.mid + "88" : P.amber + "66"}`, background: val === true ? P.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.12s" }}>
              {val === true && <span style={{ color: P.white, fontSize: 12, lineHeight: 1 }}>✓</span>}
              {val === false && <span style={{ color: P.mid, fontSize: 11, lineHeight: 1 }}>✕</span>}
            </div>
            <span style={{ fontSize: 14 }}>{t.icon || "📌"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: val === true ? P.green : val === false ? P.mid : P.dark, fontWeight: val === true ? 600 : 400, transition: "color 0.12s" }}>{t.label}</div>
              {ctx && <div style={{ fontSize: 10, color: P.mid, marginTop: 1 }}>{ctx}</div>}
            </div>
            {val === null && <span style={{ fontSize: 10, color: P.amber, fontWeight: 600 }}>tocar</span>}
          </button>);
        })}
      </div>))}
    </div>
    <div style={{ padding: "12px 16px", borderTop: `1px solid ${P.cream}`, display: "flex", gap: 8 }}>
      <Btn variant="primary" style={{ flex: 1 }} onClick={handleFinish} disabled={!allAnswered}>
        {allAnswered ? "Guardar check-in" : `Faltan ${relevant.length - answered}`}
      </Btn>
      <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
    </div>
  </div>);
}

function ResultCard({ dateStr, history, tasks, onEdit }) {
  const comp = computeCompletionForDate(dateStr, history, tasks); if (!comp) return null;
  const xp = comp.done * 10 + (comp.pct === 100 ? 20 : 0), color = pctColor(comp.pct);
  return (<div style={{ background: P.white, borderRadius: 14, border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, padding: "14px 16px", marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div style={{ flex: 1 }}><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: P.dark, marginBottom: 6 }}>{dateStr === todayStr() ? "Hoy" : dateStr === yesterdayStr() ? "Ayer" : dateStr}</div><MiniBar pct={comp.pct} color={color} height={5} /><div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color }}>{comp.pct}%</span><span style={{ fontSize: 12, color: P.mid }}>{comp.done}/{comp.total} tareas</span><span style={{ fontSize: 12, color: P.amber, fontWeight: 600 }}>+{xp} XP</span></div></div><Btn variant="ghost" style={{ padding: "4px 10px", fontSize: 12, marginLeft: 10 }} onClick={onEdit}>✏️</Btn></div></div>);
}

function TodayTab({ history, tasks, onHistoryChange, user }) {
  const today = todayStr(), yest = yesterdayStr();
  const [mode, setMode] = useState("idle"), [showPerfect, setShowPerfect] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const isEmpty = Object.keys(history).length === 0;
  const dayTasks = getTasksForDate(today, tasks);
  const todayEntry = history[today];
  const comp = todayEntry ? computeCompletionForDate(today, history, tasks) : null;
  const todayXP = comp ? comp.done * 10 + (comp.pct === 100 ? 20 : 0) : 0;
  const weeklyTasks = tasks.filter(t => t.type === "weekly_target");
  const monthlyTasks = tasks.filter(t => t.type === "monthly_accumulative");

  function handleComplete(ds, a) {
    const next = { ...history, [ds]: a };
    onHistoryChange(next);
    if (ds === today) {
      const dow = dayOfWeek(ds);
      const dailyOnly = tasks.filter(t => t.type === "daily_binary" && t.days && t.days.includes(dow));
      const dailyDone = dailyOnly.filter(t => a[t.id] === true).length;
      if (dailyOnly.length > 0 && dailyDone === dailyOnly.length) setShowPerfect(true);
    }
    setMode("idle");
  }
  function markAllDone() { const all = {}; dayTasks.forEach(t => { all[t.id] = true; }); handleComplete(today, { ...todayEntry, ...all }); }
  function resetDay() { const next = { ...history }; delete next[today]; onHistoryChange(next); setConfirmReset(false); setMode("idle"); }
  function taskContext(t) {
    if (t.type === "weekly_target") return `${weeklyCount(t.id, getWeekStart(today), history)} / ${t.weeklyTarget || 1} esta semana`;
    if (t.type === "monthly_accumulative") return `${monthlyCount(t.id, getMonthStr(today), history)} / ${t.monthlyTarget || 1} este mes`;
    return null;
  }
  const sortedTasks = [...dayTasks].sort((a, b) => { const order = { daily_binary: 0, weekly_target: 1, monthly_accumulative: 2, flexible: 3 }; return (order[a.type] ?? 9) - (order[b.type] ?? 9); });
  const typeGroups = [
    { key: "daily_binary", label: "Diarias" },
    { key: "weekly_target", label: "Semanales" },
    { key: "monthly_accumulative", label: "Mensuales" },
    { key: "flexible", label: "Flexibles" },
  ].map(g => ({ ...g, items: sortedTasks.filter(t => t.type === g.key) })).filter(g => g.items.length > 0);

  return (<div style={{ padding: "16px 16px 24px" }}>
    {showPerfect && <PerfectDayOverlay onDone={() => setShowPerfect(false)} />}
    {isEmpty && mode === "idle" && (
      <EmptyState icon="🌱" title={`Bienvenido, ${user?.name || ""}`} sub="Tu progreso comienza con una acción diaria. Registra tu primer check-in para empezar." action="Comenzar primer check-in" onAction={() => setMode("checkin")} />
    )}
    {!isEmpty && (<>
      {comp && mode === "idle" && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ background: P.white, borderRadius: 12, padding: "10px 14px", border: `1px solid ${pctColor(comp.pct)}33`, marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: pctColor(comp.pct) }}>{comp.pct}% diario</span>
              <span style={{ fontSize: 11, color: P.mid }}>{comp.done}/{comp.total} diarias · <span style={{ color: P.amber, fontWeight: 600 }}>+{todayXP} XP</span></span>
            </div>
            <MiniBar pct={comp.pct} color={pctColor(comp.pct)} height={5} />
          </div>
          {(weeklyTasks.length > 0 || monthlyTasks.length > 0) && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {weeklyTasks.map(t => { const p = computeWeeklyProgress(t.id, today, history, t); return (<div key={t.id} style={{ background: p.met ? `${P.green}15` : P.blueL, border: `1px solid ${p.met ? P.green : P.blue}33`, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: p.met ? P.green : P.blue, fontWeight: 600 }}>{t.icon || "📌"} {p.count}/{p.target} sem.</div>); })}
              {monthlyTasks.map(t => { const p = computeMonthlyProgress(t.id, today, history, t); return (<div key={t.id} style={{ background: p.met ? `${P.green}15` : `${P.amber}15`, border: `1px solid ${p.met ? P.green : P.amber}33`, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: p.met ? P.green : P.amber, fontWeight: 600 }}>{t.icon || "📌"} {p.count}/{p.target} mes</div>); })}
            </div>
          )}
        </div>
      )}
      {todayEntry ? (<>
        {mode === "idle" && (<>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Btn variant="outline" style={{ flex: 1, fontSize: 12, padding: "8px 10px" }} onClick={() => setMode("edit")}>✏️ Editar registro</Btn>
            <Btn variant="ghost" style={{ fontSize: 12, padding: "8px 10px", color: P.red }} onClick={() => setConfirmReset(true)}>🔄 Reiniciar día</Btn>
          </div>
          {confirmReset && (<div style={{ background: P.redL, borderRadius: 10, padding: "10px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: P.red }}>¿Borrar el registro de hoy?</span>
            <div style={{ display: "flex", gap: 6 }}><Btn variant="danger" style={{ fontSize: 11, padding: "5px 10px" }} onClick={resetDay}>Sí, reiniciar</Btn><Btn variant="ghost" style={{ fontSize: 11 }} onClick={() => setConfirmReset(false)}>Cancelar</Btn></div>
          </div>)}
          <div style={{ background: P.white, borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
            {sortedTasks.map((t, i) => {
              const done = todayEntry[t.id] === true, ctx = taskContext(t);
              return (<div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < sortedTasks.length - 1 ? `1px solid ${P.cream}` : "none", background: done ? `${P.green}08` : P.white }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? P.green : P.cream, border: `2px solid ${done ? P.green : P.amber + "44"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{done && <span style={{ color: P.white, fontSize: 11 }}>✓</span>}</div>
                <span style={{ fontSize: 15 }}>{t.icon || "📌"}</span>
                <div style={{ flex: 1 }}><span style={{ fontSize: 13, color: done ? P.green : P.dark, fontWeight: done ? 600 : 400 }}>{t.label}</span>{ctx && <div style={{ fontSize: 10, color: P.mid }}>{ctx}</div>}</div>
                <span style={{ fontSize: 10, color: done ? P.green : P.mid, fontWeight: 600 }}>{done ? "✓" : "—"}</span>
              </div>);
            })}
          </div>
          {comp && comp.pct < 100 && <Btn variant="outline" style={{ width: "100%", fontSize: 12 }} onClick={markAllDone}>⚡ Marcar todas como hechas</Btn>}
        </>)}
        {mode === "edit" && <CheckinFlow dateStr={today} initialAnswers={todayEntry} onComplete={a => handleComplete(today, a)} onCancel={() => setMode("idle")} tasks={tasks} history={history} />}
      </>) : mode === "checkin"
        ? <CheckinFlow dateStr={today} onComplete={a => handleComplete(today, a)} onCancel={() => setMode("idle")} tasks={tasks} history={history} />
        : (<div style={{ background: P.white, borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
            {typeGroups.map(g => (<div key={g.key}>
              {typeGroups.length > 1 && <div style={{ fontSize: 10, color: P.mid, fontWeight: 600, letterSpacing: 1, padding: "8px 14px 2px", textTransform: "uppercase" }}>{g.label}</div>}
              {g.items.map(t => { const ctx = taskContext(t); return (<div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${P.cream}` }}><span style={{ fontSize: 15 }}>{t.icon || "📌"}</span><div style={{ flex: 1 }}><span style={{ fontSize: 13, color: P.dark }}>{t.label}</span>{ctx && <div style={{ fontSize: 10, color: P.mid }}>{ctx}</div>}</div><span style={{ fontSize: 10, color: P.mid, background: P.cream, borderRadius: 6, padding: "2px 7px" }}>{TYPE_LABELS[t.type]}</span></div>); })}
            </div>))}
            <div style={{ padding: "12px 14px" }}><Btn variant="primary" style={{ width: "100%", fontSize: 15 }} onClick={() => setMode("checkin")}>Iniciar check-in de hoy</Btn></div>
          </div>)
      }
      <div style={{ marginTop: 4 }}>
        {history[yest] ? (<>
          <div style={{ fontSize: 11, color: P.mid, margin: "8px 0 4px" }}>— Ayer —</div>
          {(() => { const yc = computeCompletionForDate(yest, history, tasks); const yxp = yc ? yc.done * 10 + (yc.pct === 100 ? 20 : 0) : 0; const col = yc ? pctColor(yc.pct) : P.mid; return (<div style={{ background: P.white, borderRadius: 12, padding: "10px 14px", border: `1px solid ${col}22`, borderLeft: `3px solid ${col}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><span style={{ fontSize: 13, fontWeight: 600, color: col }}>{yc ? yc.pct : 0}%</span><span style={{ fontSize: 11, color: P.mid, marginLeft: 8 }}>{yc ? `${yc.done}/${yc.total}` : "—"} · <span style={{ color: P.amber }}>+{yxp} XP</span></span></div><Btn variant="ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setMode("edit_yest")}>✏️ Editar</Btn></div>); })()}
          {mode === "edit_yest" && <CheckinFlow dateStr={yest} initialAnswers={history[yest]} onComplete={a => handleComplete(yest, a)} onCancel={() => setMode("idle")} tasks={tasks} history={history} />}
        </>) : mode === "checkin_yest"
          ? (<><div style={{ fontSize: 11, color: P.mid, margin: "8px 0 4px" }}>Registrando ayer · {yest}</div><CheckinFlow dateStr={yest} onComplete={a => handleComplete(yest, a)} onCancel={() => setMode("idle")} tasks={tasks} history={history} /></>)
          : <Btn variant="outline" style={{ width: "100%", fontSize: 13 }} onClick={() => setMode("checkin_yest")}>+ Registrar ayer</Btn>
        }
      </div>
    </>)}
    {isEmpty && mode === "checkin" && <CheckinFlow dateStr={today} onComplete={a => handleComplete(today, a)} onCancel={() => setMode("idle")} tasks={tasks} history={history} />}
  </div>);
}

function WeekTab({ history, tasks, onHistoryChange }) {
  const days = getLast7Days(), today = todayStr(), [editing, setEditing] = useState(null);
  return (<div style={{ padding: "16px 16px 24px" }}>
    <SectionLabel>Últimos 7 días</SectionLabel>
    {days.map(d => { const comp = computeCompletionForDate(d, history, tasks), isFuture = d > today, isToday = d === today, accentColor = isToday ? P.amber : d < today ? P.blue : P.mid; if (editing === d) return (<div key={d} style={{ marginBottom: 10 }}><CheckinFlow dateStr={d} initialAnswers={history[d]} onComplete={a => { onHistoryChange({ ...history, [d]: a }); setEditing(null); }} onCancel={() => setEditing(null)} tasks={tasks} history={history} /></div>); return (<div key={d} style={{ background: P.white, borderRadius: 12, marginBottom: 8, borderLeft: `3px solid ${isFuture ? P.cream : accentColor}`, overflow: "hidden" }}><div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 12 }}><div style={{ width: 44, flexShrink: 0 }}><div style={{ fontSize: 11, fontWeight: 600, color: isToday ? P.amber : P.mid }}>{DOW_ES[new Date(d + "T12:00:00").getDay()]}</div><div style={{ fontSize: 10, color: P.mid }}>{d.slice(5)}</div></div><div style={{ flex: 1 }}>{comp ? <MiniBar pct={comp.pct} color={pctColor(comp.pct)} height={6} /> : <div style={{ height: 6, background: P.cream, borderRadius: 3 }} />}</div><div style={{ width: 56, textAlign: "right", flexShrink: 0 }}>{isFuture ? <span style={{ fontSize: 11, color: P.mid }}>—</span> : comp ? <span style={{ fontSize: 13, fontWeight: 600, color: pctColor(comp.pct) }}>{comp.pct}%</span> : <span style={{ fontSize: 11, color: P.amber }}>pendiente</span>}</div><div style={{ width: 36, textAlign: "right", flexShrink: 0 }}>{!isFuture && (<button style={{ background: "none", border: `1px solid ${P.amber}55`, borderRadius: 6, padding: "3px 6px", fontSize: 11, color: P.amber, cursor: "pointer" }} onClick={() => setEditing(d)}>{comp ? "✏️" : "＋"}</button>)}</div></div></div>); })}
  </div>);
}

function MonthlyTab({ history, tasks }) {
  const stats = computeMonthlyStats(history, tasks), adjs = computeMonthlyAdjustments(history, tasks), cons = computeMonthlyConsistency(history, tasks), months = Object.keys(stats).sort().reverse();
  if (!months.length) return (<div style={{ padding: "24px 16px" }}><EmptyState icon="📅" title="Este mes aún no tiene datos" sub="Registra al menos un día para ver tus métricas mensuales." /></div>);
  const totalXP = months.reduce((a, m) => a + (stats[m].xp + (adjs[m] || 0) + (cons[m] || 0)), 0), totalDays = months.reduce((a, m) => a + stats[m].daysTracked, 0), avgAll = Math.round(months.reduce((a, m) => a + stats[m].avgCompletion, 0) / months.length);
  return (<div style={{ padding: "16px 16px 24px" }}><div style={{ display: "flex", gap: 8, marginBottom: 16 }}><Chip label="Promedio global" value={`${avgAll}%`} color={pctColor(avgAll)} /><Chip label="Días totales" value={totalDays} color={P.blue} /><Chip label="XP acumulado" value={totalXP} color={P.amber} /></div><Divider /><div style={{ marginTop: 14 }}>{months.map(m => { const s = stats[m], tier = computeMonthlyTier(s), t = TIER[tier], adj = adjs[m] || 0, con = cons[m] || 0, totalM = s.xp + adj + con, isCur = m === todayStr().slice(0, 7); return (<div key={m} style={{ background: P.white, borderRadius: 14, border: `1px solid ${isCur ? P.amber + "55" : P.cream}`, marginBottom: 10, overflow: "hidden" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px 10px", borderBottom: `1px solid ${P.cream}` }}><div><span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: P.dark }}>{MONTH_FULL[parseInt(m.split("-")[1], 10) - 1]} {m.split("-")[0]}</span>{isCur && <span style={{ marginLeft: 8, fontSize: 10, color: P.amber, fontWeight: 600 }}>MES ACTUAL</span>}</div><TierPill tier={tier} /></div><div style={{ padding: "12px 16px" }}><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><div style={{ flex: 1 }}><MiniBar pct={s.avgCompletion} color={t.color} height={7} /></div><span style={{ fontSize: 18, fontWeight: 600, color: t.color, minWidth: 44, textAlign: "right" }}>{s.avgCompletion}%</span></div><div style={{ display: "flex", gap: 6 }}><Chip label="días" value={s.daysTracked} color={P.dark} /><Chip label="XP base" value={s.xp} color={P.dark} /><Chip label="ajuste" value={(adj + con >= 0 ? "+" : "") + (adj + con)} color={adj + con >= 0 ? P.green : P.red} /><Chip label="XP total" value={totalM} color={P.amber} /></div></div></div>); })}</div></div>);
}

function AnnualTab({ history, tasks }) {
  const months12 = getOrderedMonths(history), stats = computeMonthlyStats(history, tasks), adjs = computeMonthlyAdjustments(history, tasks), cons = computeMonthlyConsistency(history, tasks), curMonth = todayStr().slice(0, 7);
  const rows = months12.map(m => ({ m, s: stats[m] || null, tier: stats[m] ? computeMonthlyTier(stats[m]) : null, adj: adjs[m] || 0, con: cons[m] || 0 })), withData = rows.filter(r => r.s);
  const yearXP = withData.reduce((a, r) => a + (r.s.xp + r.adj + r.con), 0), yearDays = withData.reduce((a, r) => a + r.s.daysTracked, 0), avgPct = withData.length ? Math.round(withData.reduce((a, r) => a + r.s.avgCompletion, 0) / withData.length) : 0, BAR_MAX = 100;
  return (<div style={{ padding: "16px 16px 24px" }}><div style={{ display: "flex", gap: 8, marginBottom: 16 }}><Chip label="Promedio anual" value={`${avgPct}%`} color={pctColor(avgPct)} /><Chip label="Días" value={yearDays} color={P.blue} /><Chip label="XP total" value={yearXP} color={P.amber} /></div><div style={{ background: P.white, borderRadius: 14, padding: "16px 12px 12px", marginBottom: 16 }}><div style={{ fontSize: 11, color: P.mid, marginBottom: 12, letterSpacing: 1 }}>AVANCE MENSUAL</div><div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: BAR_MAX + 32, paddingBottom: 22, position: "relative" }}>{[25, 50, 75, 100].map(v => (<div key={v} style={{ position: "absolute", left: 0, right: 0, bottom: 22 + (v / 100) * BAR_MAX, height: 1, background: P.cream, zIndex: 0 }} />))}{rows.map(({ m, s, tier }) => { const pct = s ? s.avgCompletion : 0, barH = s ? Math.max(3, Math.round((pct / 100) * BAR_MAX)) : 3, isCur = m === curMonth, barColor = s ? tier === "elite" ? P.amber : tier === "solido" ? P.blue : tier === "regular" ? "#C4A44A" : P.red : P.cream; return (<div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: BAR_MAX + 4, position: "relative", zIndex: 1 }}>{s && <div style={{ fontSize: 8, color: barColor, marginBottom: 2, fontWeight: 600 }}>{pct}%</div>}<div style={{ width: "100%", background: barColor, borderRadius: "3px 3px 0 0", outline: isCur ? `2px solid ${P.dark}` : "none", outlineOffset: -1, height: 0, transition: "height 0.65s cubic-bezier(.4,0,.2,1)" }} ref={el => { if (el) setTimeout(() => { el.style.height = barH + "px"; }, 50 + rows.findIndex(r => r.m === m) * 40) }} /><div style={{ position: "absolute", bottom: -18, fontSize: 8, fontWeight: isCur ? 700 : 400, color: isCur ? P.dark : P.mid }}>{MONTH_NAMES[parseInt(m.split("-")[1], 10) - 1]}</div></div>); })}</div><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${P.cream}` }}>{[["Élite", P.amber], ["Sólido", P.blue], ["Regular", "#C4A44A"], ["Crítico", P.red], ["Sin datos", P.cream]].map(([l, c]) => (<span key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: P.mid }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />{l}</span>))}</div></div><div style={{ background: P.white, borderRadius: 14, overflow: "hidden" }}><div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.6fr 1fr 1fr 1fr", background: P.blue, color: P.cream, fontSize: 10, fontWeight: 600, padding: "10px 12px", gap: 4, letterSpacing: 0.5 }}>{["Mes", "Prom.", "Nivel", "Días", "XP", "Ajuste"].map(h => <div key={h}>{h}</div>)}</div>{rows.map(({ m, s, tier, adj, con }, i) => { const t = tier ? TIER[tier] : null, totalAdj = adj + con, isCur = m === curMonth; return (<div key={m} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.6fr 1fr 1fr 1fr", fontSize: 11, padding: "8px 12px", gap: 4, background: isCur ? "#EEF5FF" : i % 2 === 0 ? P.white : P.cream + "55", borderBottom: `1px solid ${P.cream}`, alignItems: "center" }}><div style={{ fontWeight: isCur ? 600 : 400, color: isCur ? P.blue : P.dark }}>{MONTH_NAMES[parseInt(m.split("-")[1], 10) - 1]} {m.slice(2, 4)}</div><div style={{ color: s ? pctColor(s.avgCompletion) : P.mid }}>{s ? `${s.avgCompletion}%` : "—"}</div><div style={{ color: t ? t.color : P.mid, fontSize: 10 }}>{t ? `${t.icon} ${t.label}` : "—"}</div><div style={{ color: P.mid }}>{s ? s.daysTracked : "—"}</div><div style={{ color: P.dark }}>{s ? s.xp : "—"}</div><div style={{ color: s ? (totalAdj >= 0 ? P.green : P.red) : P.mid, fontWeight: 600 }}>{s ? (totalAdj >= 0 ? "+" : "") + totalAdj : "—"}</div></div>); })}</div></div>);
}

function BadgesTab({ history, tasks }) {
  const badges = computeBadges(history, tasks), prevRef = useRef(null), [newlyUnlocked, setNewlyUnlocked] = useState(new Set());
  const groups = ["streak", "acumulativo", "xp", "perfeccion", "mensual", "consistencia"];
  const gLabels = { streak: "Rachas", acumulativo: "Acumulativos", xp: "Experiencia", perfeccion: "Perfección", mensual: "Mensuales", consistencia: "Consistencia" };
  useEffect(() => { if (prevRef.current) { const prev = new Set(prevRef.current.filter(b => b.unlocked).map(b => b.id)); const curr = new Set(badges.filter(b => b.unlocked).map(b => b.id)); const just = new Set([...curr].filter(id => !prev.has(id))); if (just.size > 0) setNewlyUnlocked(just); } prevRef.current = badges; }, [badges]);
  const unlocked = badges.filter(b => b.unlocked).length;
  return (<div style={{ padding: "16px 16px 24px" }}><div style={{ background: P.white, borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, border: `1px solid ${P.amber}33` }}><span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: P.dark }}>Insignias desbloqueadas</span><span style={{ background: P.amber, color: P.white, borderRadius: 20, padding: "3px 12px", fontSize: 13, fontWeight: 600 }}>{unlocked} / {badges.length}</span></div>{groups.map(g => { const group = badges.filter(b => b.type === g); if (!group.length) return null; return (<div key={g} style={{ marginBottom: 18 }}><div style={{ fontSize: 10, fontWeight: 600, color: P.mid, letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase", paddingLeft: 2 }}>{gLabels[g]}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{group.map(b => { const isNew = newlyUnlocked.has(b.id); return (<div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: b.unlocked ? P.white : P.cream, border: `1.5px solid ${b.unlocked ? P.amber : P.cream}`, opacity: b.unlocked ? 1 : 0.55, boxShadow: b.unlocked ? `0 1px 6px rgba(193,127,58,${isNew ? 0.35 : 0.15})` : "none", minWidth: 140, animation: isNew ? "popIn 0.4s cubic-bezier(.34,1.56,.64,1) both" : b.unlocked ? "fadeIn 0.3s ease both" : "none" }}><span style={{ fontSize: 20, filter: b.unlocked ? "none" : "grayscale(1)" }}>{b.icon}</span><div><div style={{ fontSize: 12, fontWeight: 600, color: b.unlocked ? P.dark : P.mid }}>{b.label}</div><div style={{ fontSize: 10, color: b.unlocked ? P.amber : P.mid, marginTop: 1 }}>{b.unlocked ? "✓ desbloqueada" : "bloqueada"}</div></div></div>); })}</div></div>); })}</div>);
}

const INSIGHT_CONFIG = {
  positive: { bg: "#F0F9EC", border: P.green, textColor: P.green, label: "Positivo" },
  warning:  { bg: P.blueL,  border: P.blue,  textColor: P.blue,  label: "Atención" },
  critical: { bg: P.redL,   border: P.red,   textColor: P.red,   label: "Crítico"  },
};
function InsightsTab({ history, tasks }) {
  const { insights, recommendations, taskStats, dayStats, overallAvg, dates } = computeInsights(history, tasks);
  const hasEnoughData = dates && dates.length >= 3;
  if (!hasEnoughData) return (<div style={{ padding: "24px 16px" }}><EmptyState icon="📊" title="Aún no hay información suficiente" sub="Registra al menos 3 días para que el sistema detecte tus patrones de comportamiento." /></div>);
  const positives = insights.filter(i => i.type === "positive"), warnings = insights.filter(i => i.type === "warning"), criticals = insights.filter(i => i.type === "critical");
  const dowOrder = ["mon","tue","wed","thu","fri","sat","sun"], dayMap = Object.fromEntries(dayStats.map(d => [d.dow, d]));
  return (<div style={{ padding: "16px 16px 24px" }}>
    <div style={{ background: P.white, borderRadius: 14, padding: "14px 16px", marginBottom: 14, border: `1px solid ${P.cream}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: P.dark }}>Diagnóstico general</div>
        <div style={{ display: "flex", gap: 6 }}>
          {criticals.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: P.red, background: P.redL, borderRadius: 8, padding: "2px 8px" }}>{criticals.length} crítico{criticals.length > 1 ? "s" : ""}</span>}
          {warnings.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: P.blue, background: P.blueL, borderRadius: 8, padding: "2px 8px" }}>{warnings.length} aviso{warnings.length > 1 ? "s" : ""}</span>}
          {positives.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: P.green, background: "#EAF3DE", borderRadius: 8, padding: "2px 8px" }}>{positives.length} positivo{positives.length > 1 ? "s" : ""}</span>}
        </div>
      </div>
      <MiniBar pct={overallAvg || 0} color={pctColor(overallAvg || 0)} height={7} />
      <div style={{ fontSize: 12, color: P.mid, marginTop: 6 }}>{overallAvg}% promedio global · {dates.length} días analizados</div>
    </div>
    <div style={{ background: P.white, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: P.mid, letterSpacing: 1, marginBottom: 10 }}>RENDIMIENTO POR DÍA DE LA SEMANA</div>
      <div style={{ display: "flex", gap: 4 }}>
        {dowOrder.map(d => { const ds = dayMap[d], avg = ds ? ds.avg : null, color = avg !== null ? pctColor(avg) : P.cream; return (<div key={d} style={{ flex: 1, textAlign: "center" }}><div style={{ height: 36, background: avg !== null ? color + "18" : P.cream, border: `1.5px solid ${avg !== null ? color + "55" : P.cream}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}><span style={{ fontSize: 11, fontWeight: 700, color: avg !== null ? color : P.mid }}>{avg !== null ? `${avg}%` : "—"}</span></div><div style={{ fontSize: 9, color: P.mid, fontWeight: 600 }}>{DAYS_LABELS[d].slice(0, 3)}</div></div>); })}
      </div>
    </div>
    {taskStats.length > 0 && (<div style={{ background: P.white, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: P.mid, letterSpacing: 1, marginBottom: 10 }}>TASA DE CUMPLIMIENTO POR TAREA</div>
      {taskStats.filter(ts => ts.total >= 2).map(ts => (<div key={ts.task.id} style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 14 }}>{ts.task.icon || "📌"}</span><span style={{ fontSize: 13, color: P.dark }}>{ts.task.label}</span></div><span style={{ fontSize: 12, fontWeight: 600, color: pctColor(ts.rate) }}>{ts.rate}%</span></div><MiniBar pct={ts.rate} color={pctColor(ts.rate)} height={5} /><div style={{ fontSize: 10, color: P.mid, marginTop: 3 }}>{ts.count} de {ts.total} días</div></div>))}
    </div>)}
    {insights.length > 0 && (<><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: P.dark, marginBottom: 10 }}>Insights detectados</div>{[...criticals, ...warnings, ...positives].map((ins, i) => { const cfg = INSIGHT_CONFIG[ins.type]; return (<div key={i} style={{ background: cfg.bg, borderRadius: 12, border: `1px solid ${cfg.border}33`, borderLeft: `3px solid ${cfg.border}`, padding: "12px 14px", marginBottom: 8, animation: `fadeSlideIn 0.2s ease ${i * 40}ms both` }}><div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{ins.icon}</span><div><div style={{ fontSize: 13, fontWeight: 600, color: cfg.textColor, marginBottom: 2 }}>{ins.message}</div>{ins.detail && <div style={{ fontSize: 11, color: P.mid }}>{ins.detail}</div>}<span style={{ fontSize: 10, color: cfg.border, fontWeight: 600, background: `${cfg.border}18`, borderRadius: 6, padding: "1px 7px", marginTop: 4, display: "inline-block", textTransform: "uppercase", letterSpacing: 0.5 }}>{cfg.label}</span></div></div></div>); })}</>)}
    {recommendations.length > 0 && (<><Divider /><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: P.dark, margin: "14px 0 10px" }}>Recomendaciones</div>{recommendations.map((rec, i) => (<div key={i} style={{ background: P.white, borderRadius: 12, border: `1px solid ${P.amber}33`, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10, alignItems: "flex-start", animation: `fadeSlideIn 0.2s ease ${i * 50}ms both` }}><span style={{ fontSize: 18, flexShrink: 0 }}>{rec.icon}</span><span style={{ fontSize: 13, color: P.dark, lineHeight: 1.5 }}>{rec.message}</span></div>))}</>)}
    {insights.length === 0 && <EmptyState icon="✨" title="Sin patrones detectados aún" sub="Sigue registrando días para que el sistema identifique tendencias." />}
  </div>);
}

function emptyForm() { return { label: "", type: "daily_binary", icon: "📌", days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], weeklyTarget: 3, monthlyTarget: 4 }; }
function TaskForm({ initial, existingLabels, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyForm()), [error, setError] = useState("");
  const isEdit = !!initial?.id;
  function toggleDay(d) { setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] })); }
  function validate() { if (!form.label.trim()) { setError("El nombre es obligatorio."); return false; } const dup = existingLabels.filter(l => l.toLowerCase() === form.label.trim().toLowerCase() && !(isEdit && initial.label.toLowerCase() === form.label.trim().toLowerCase())); if (dup.length) { setError("Ya existe una tarea con ese nombre."); return false; } if (form.type === "daily_binary" && form.days.length === 0) { setError("Selecciona al menos un día."); return false; } if (form.type === "weekly_target" && (isNaN(form.weeklyTarget) || form.weeklyTarget < 1)) { setError("Meta semanal debe ser ≥ 1."); return false; } if (form.type === "monthly_accumulative" && (isNaN(form.monthlyTarget) || form.monthlyTarget < 1)) { setError("Meta mensual debe ser ≥ 1."); return false; } setError(""); return true; }
  function handleSave() { if (!validate()) return; onSave({ ...form, label: form.label.trim(), id: initial?.id || uid() }); }
  const inp = { width: "100%", background: P.cream, border: `1px solid ${P.amber}33`, borderRadius: 8, padding: "9px 12px", fontFamily: "'Inter',sans-serif", fontSize: 14, color: P.dark, outline: "none" };
  return (<div style={{ background: P.white, borderRadius: 14, padding: 18, border: `1px solid ${P.amber}44`, marginBottom: 12, animation: "popIn 0.25s ease both" }}><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: P.dark, marginBottom: 14 }}>{isEdit ? "Editar tarea" : "Nueva tarea"}</div><div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: P.mid, marginBottom: 4 }}>NOMBRE</div><input style={inp} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ej: Meditación matutina" /></div><div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: P.mid, marginBottom: 6 }}>ÍCONO</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{ICON_OPTIONS.map(ic => (<button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))} style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${form.icon === ic ? P.amber : P.cream}`, background: form.icon === ic ? `${P.amber}18` : P.cream, fontSize: 18, cursor: "pointer" }}>{ic}</button>))}</div></div><div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: P.mid, marginBottom: 4 }}>TIPO</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{Object.entries(TYPE_LABELS).map(([k, l]) => (<button key={k} onClick={() => setForm(f => ({ ...f, type: k }))} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1.5px solid ${form.type === k ? P.blue : P.cream}`, background: form.type === k ? P.blueL : P.cream, color: form.type === k ? P.blue : P.mid, cursor: "pointer" }}>{l}</button>))}</div></div>{form.type === "daily_binary" && (<div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: P.mid, marginBottom: 6 }}>DÍAS</div><div style={{ display: "flex", gap: 6 }}>{DAY_ORDER.map(d => (<button key={d} onClick={() => toggleDay(d)} style={{ flex: 1, padding: "6px 2px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1.5px solid ${form.days.includes(d) ? P.amber : P.cream}`, background: form.days.includes(d) ? `${P.amber}18` : P.cream, color: form.days.includes(d) ? P.amberD : P.mid, cursor: "pointer" }}>{DAYS_LABELS[d]}</button>))}</div></div>)}{form.type === "weekly_target" && (<div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: P.mid, marginBottom: 4 }}>META SEMANAL</div><input style={{ ...inp, width: 80 }} type="number" min="1" max="7" value={form.weeklyTarget} onChange={e => setForm(f => ({ ...f, weeklyTarget: parseInt(e.target.value) || 1 }))} /></div>)}{form.type === "monthly_accumulative" && (<div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: P.mid, marginBottom: 4 }}>META MENSUAL</div><input style={{ ...inp, width: 80 }} type="number" min="1" max="31" value={form.monthlyTarget} onChange={e => setForm(f => ({ ...f, monthlyTarget: parseInt(e.target.value) || 1 }))} /></div>)}{error && <div style={{ fontSize: 12, color: P.red, marginBottom: 10, background: P.redL, borderRadius: 8, padding: "6px 10px" }}>{error}</div>}<div style={{ display: "flex", gap: 8, marginTop: 4 }}><Btn variant="primary" style={{ flex: 1 }} onClick={handleSave}>{isEdit ? "Guardar cambios" : "Crear tarea"}</Btn><Btn variant="outline" onClick={onCancel}>Cancelar</Btn></div></div>);
}

function TasksTab({ tasks, onTasksChange, user, onUserSave }) {
  const [mode, setMode] = useState("list"), [editTarget, setEditTarget] = useState(null), [confirmDelete, setConfirmDelete] = useState(null);
  const [nameVal, setNameVal] = useState(user?.name || ""), [nameErr, setNameErr] = useState(""), [nameSaved, setNameSaved] = useState(false);
  function handleNameSave() { if (nameVal.trim().length < 2) { setNameErr("Mínimo 2 caracteres."); return; } onUserSave(nameVal.trim()); setNameErr(""); setNameSaved(true); setTimeout(() => setNameSaved(false), 2000); }
  const labels = tasks.map(t => t.label);
  function handleSave(task) { if (editTarget) onTasksChange(tasks.map(t => t.id === task.id ? task : t)); else onTasksChange([...tasks, task]); setMode("list"); setEditTarget(null); }
  function handleDelete(id) { onTasksChange(tasks.filter(t => t.id !== id)); setConfirmDelete(null); }
  function freqLabel(t) { if (t.type === "daily_binary") return t.days.map(d => DAYS_LABELS[d]).join(", "); if (t.type === "weekly_target") return `${t.weeklyTarget}x / semana`; if (t.type === "monthly_accumulative") return `${t.monthlyTarget}x / mes`; return "Sin restricción"; }
  return (<div style={{ padding: "16px 16px 24px" }}>{mode === "list" && (<>
    <div style={{ background: P.white, borderRadius: 14, padding: "14px 16px", marginBottom: 14, border: `1px solid ${P.cream}` }}>
      <div style={{ fontSize: 11, color: P.mid, letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>PERFIL</div>
      <div style={{ fontSize: 11, color: P.mid, marginBottom: 4 }}>Nombre</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={nameVal} onChange={e => { setNameVal(e.target.value); setNameErr(""); setNameSaved(false); }} style={{ flex: 1, background: P.cream, border: `1.5px solid ${nameErr ? P.red : P.amber}33`, borderRadius: 8, padding: "8px 12px", fontFamily: "'Inter',sans-serif", fontSize: 14, color: P.dark, outline: "none" }} />
        <Btn variant="outline" style={{ fontSize: 12, padding: "8px 14px", color: nameSaved ? P.green : P.blue }} onClick={handleNameSave}>{nameSaved ? "✓ Guardado" : "Actualizar"}</Btn>
      </div>
      {nameErr && <div style={{ fontSize: 11, color: P.red, marginTop: 4 }}>{nameErr}</div>}
    </div>
    <Divider />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: P.dark }}>Mis tareas</div><Btn variant="primary" style={{ fontSize: 12, padding: "7px 14px" }} onClick={() => setMode("create")}>+ Nueva tarea</Btn></div>
    {tasks.length === 0 && <div style={{ background: P.white, borderRadius: 12, padding: "20px 16px", textAlign: "center", color: P.mid, fontSize: 14, border: `1px dashed ${P.amber}44` }}>Sin tareas configuradas.</div>}
    {tasks.map(t => (<div key={t.id} style={{ background: P.white, borderRadius: 12, marginBottom: 8, padding: "12px 14px", border: `1px solid ${P.cream}` }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 20 }}>{t.icon || "📌"}</span><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: P.dark }}>{t.label}</div><div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}><span style={{ fontSize: 10, color: P.blue, background: P.blueL, borderRadius: 6, padding: "1px 7px", fontWeight: 600 }}>{TYPE_LABELS[t.type]}</span><span style={{ fontSize: 10, color: P.mid }}>{freqLabel(t)}</span></div></div><div style={{ display: "flex", gap: 6 }}><button style={{ background: "none", border: `1px solid ${P.amber}44`, borderRadius: 6, padding: "4px 8px", fontSize: 11, color: P.amber, cursor: "pointer" }} onClick={() => { setEditTarget(t); setMode("edit"); }}>✏️</button><button style={{ background: "none", border: `1px solid ${P.red}44`, borderRadius: 6, padding: "4px 8px", fontSize: 11, color: P.red, cursor: "pointer" }} onClick={() => setConfirmDelete(t.id)}>🗑️</button></div></div>{confirmDelete === t.id && (<div style={{ marginTop: 10, background: P.redL, borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 12, color: P.red }}>¿Eliminar "{t.label}"? El historial previo se conserva.</span><div style={{ display: "flex", gap: 6 }}><Btn variant="danger" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => handleDelete(t.id)}>Eliminar</Btn><Btn variant="ghost" style={{ fontSize: 11 }} onClick={() => setConfirmDelete(null)}>Cancelar</Btn></div></div>)}</div>))}
  </>)}{(mode === "create" || mode === "edit") && (<TaskForm initial={mode === "edit" ? editTarget : null} existingLabels={labels} onSave={handleSave} onCancel={() => { setMode("list"); setEditTarget(null); }} />)}</div>);
}

// ══════ COACH ENGINE ══════
function buildCoachMessage(history, tasks) {
  const priorities = computePriorityTasks(history, tasks);
  const { dates } = computeExtendedInsights(history, tasks);
  if (!dates || dates.length < 3) return null;
  const criticas = priorities.filter(p => p.priority === "roja"), medias = priorities.filter(p => p.priority === "amarilla");
  const sorted = [...dates].sort(), recent7 = sorted.slice(-7), prev7 = sorted.slice(-14, -7);
  function avgPct(ds) { const vals = ds.map(d => computeCompletionForDate(d, history, tasks)).filter(Boolean); return vals.length ? Math.round(vals.reduce((a,c) => a+c.pct, 0) / vals.length) : null; }
  const rAvg = avgPct(recent7), pAvg = avgPct(prev7);
  const trend = (rAvg !== null && pAvg !== null) ? rAvg - pAvg : 0;
  const dropping = trend <= -10, improving = trend >= 10;
  const affected = criticas.length + medias.length;
  let diag;
  if (affected >= 2) { const maxDays = Math.max(...[...criticas,...medias].map(p => p.daysSinceDone||0)); diag = `${affected} hábitos sin actividad en los últimos ${maxDays} días.\nLa consistencia del sistema es baja.`; }
  else if (criticas.length === 1) diag = `1 hábito crítico sin cerrar en ${criticas[0].daysSinceDone||"varios"} días.\nEl sistema tiene un punto de fallo activo.`;
  else if (dropping) diag = `Rendimiento bajó ${Math.abs(trend)} puntos respecto a la semana anterior.\nLa tendencia es negativa.`;
  else if (improving) diag = `Rendimiento subió ${trend} puntos respecto a la semana anterior.\nEl sistema está respondiendo.`;
  else diag = `Sin alertas críticas activas.\nEl sistema opera dentro de parámetros normales.`;
  const impact = (affected > 0 || dropping) ? "Esto reduce el avance semanal y bloquea el cierre de metas mensuales." : null;
  const worstTask = criticas[0] || medias[0];
  let action;
  if (worstTask) action = `Empieza hoy:\n→ "${worstTask.task.label}" (5 min, versión mínima)`;
  else if (dropping) action = `Empieza hoy:\n→ Registra al menos 1 tarea diaria sin excepción`;
  else action = `Empieza hoy:\n→ Mantén el registro diario sin interrupciones`;
  return { diag, impact, action, trend, criticas: criticas.length };
}

// ══════ SVG ICONS ══════
function IconColumn(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="4" width="12" height="2"/><rect x="8" y="6" width="8" height="12"/><rect x="6" y="18" width="12" height="2"/></svg>);}
function IconLaurel(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18 C8 14 8 10 6 6"/><path d="M18 18 C16 14 16 10 18 6"/></svg>);}
function IconHelmet(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 12 A6 6 0 0 1 18 12"/><path d="M9 12 L15 12"/></svg>);}
function IconOwl(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><path d="M8 16 L16 16"/></svg>);}
function IconScroll(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="5" width="12" height="14"/></svg>);}
function IconSun(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4"/></svg>);}
function IconMoon(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 3 A9 9 0 1 0 21 15 A7 7 0 0 1 15 3"/></svg>);}
function IconFlame(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3 C16 8 8 10 12 18"/></svg>);}
function IconPath(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 20 C10 10 14 10 20 4"/></svg>);}
function IconBalance(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3 L12 20"/><path d="M6 8 L18 8"/></svg>);}

function getTaskIcon(task) {
  const n = task.label.toLowerCase();
  if (n.includes("revis")) return IconScroll;
  if (n.includes("leer") || n.includes("lectura") || n.includes("estudio")) return IconOwl;
  if (n.includes("ejercicio") || n.includes("actividad") || n.includes("entrena")) return IconHelmet;
  if (n.includes("meditar") || n.includes("meditaci") || n.includes("reflexi") || n.includes("estoic")) return IconLaurel;
  if (n.includes("gratitud") || n.includes("agradec")) return IconSun;
  if (n.includes("dormir") || n.includes("sueño")) return IconMoon;
  if (n.includes("caminar") || n.includes("paseo")) return IconPath;
  if (n.includes("trading") || n.includes("finanz")) return IconBalance;
  if (n.includes("agua")) return IconFlame;
  return IconColumn;
}

// ══════ GUIDE TAB ══════
function GuideTab({ history, tasks }) {
  const priorities = computePriorityTasks(history, tasks);
  const insightsData = computeExtendedInsights(history, tasks);
  const coach = buildCoachMessage(history, tasks);
  const insights = insightsData.insights || [];
  const recommendations = insightsData.recommendations || [];
  const hasData = insightsData.dates && insightsData.dates.length >= 3;

  if (!hasData) return (<div style={{ padding:"24px 16px" }}><EmptyState icon="🧭" title="Guía aún no disponible" sub="Registra al menos 3 días para que el sistema genere recomendaciones personalizadas." /></div>);

  const criticas = priorities.filter(p => p.priority === "roja");
  const medias = priorities.filter(p => p.priority === "amarilla");
  const topTasks = [...criticas, ...medias].slice(0, 3);
  const coachColor = coach && coach.criticas >= 2 ? P.red : coach && coach.criticas >= 1 ? P.orange : P.green;

  return (<div style={{ padding:"16px 16px 24px" }}>
    {coach && (
      <div style={{ background: P.white, border: `1.5px solid ${coachColor}44`, borderLeft: `4px solid ${coachColor}`, borderRadius: 14, padding: "18px 18px 16px", marginBottom: 16 }}>
        <div style={{ fontSize:10, fontWeight:600, color:coachColor, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" }}>Diagnóstico de hoy</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:P.dark, fontWeight:400, lineHeight:1.4, margin:"0 0 10px", whiteSpace:"pre-line" }}>{coach.diag}</div>
        {coach.impact && <p style={{ fontSize:13, color:P.mid, lineHeight:1.5, margin:"0 0 12px", borderTop:`1px solid ${P.cream}`, paddingTop:10 }}>{coach.impact}</p>}
        <div style={{ background:`${coachColor}0D`, borderRadius:10, padding:"10px 12px", display:"flex", gap:8, alignItems:"flex-start" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>→</span>
          <span style={{ fontSize:13, fontWeight:600, color:coachColor, lineHeight:1.5, whiteSpace:"pre-line" }}>{coach.action}</span>
        </div>
      </div>
    )}
    {topTasks.length > 0 && (<>
      <SectionLabel>Tareas que necesitan atención</SectionLabel>
      {topTasks.map(({ task, priority, daysSinceDone }) => {
        const cfg = { roja:{ color:P.red, bg:P.redL, icon:"🔴", label:"Crítica" }, amarilla:{ color:"#7A6020", bg:"#FBF5E6", icon:"🟡", label:"Media" } }[priority];
        return (<div key={task.id} style={{ background:P.white, borderRadius:12, border:`1px solid ${cfg.color}22`, borderLeft:`3px solid ${cfg.color}`, padding:"11px 14px", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{task.icon||"📌"}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:600, color:P.dark }}>{task.label}</span>
                <span style={{ fontSize:10, fontWeight:600, color:cfg.color, background:cfg.bg, borderRadius:6, padding:"2px 7px" }}>{cfg.icon} {cfg.label}</span>
              </div>
              <div style={{ fontSize:11, color:P.mid, marginTop:2 }}>Sin registros en {daysSinceDone || "varios"} días</div>
            </div>
          </div>
        </div>);
      })}
    </>)}
    {recommendations.length > 0 && (<>
      <SectionLabel>Acciones concretas</SectionLabel>
      {recommendations.slice(0, 3).map((rec, i) => (
        <div key={i} style={{ background:P.white, borderRadius:12, border:`1px solid ${P.amber}22`, padding:"11px 14px", marginBottom:8, display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:13, fontWeight:600, color:P.amber, flexShrink:0 }}>{i+1}.</span>
          <span style={{ fontSize:13, color:P.dark, lineHeight:1.4 }}>{rec.message}</span>
        </div>
      ))}
    </>)}
    {topTasks.length===0 && recommendations.length===0 && <EmptyState icon="🎯" title="Todo en orden" sub="No hay alertas activas. Mantén el ritmo." />}
  </div>);
}

// ══════ NAME MODAL ══════
function NameModal({ onSave }) {
  const [name, setName] = useState("");
  return (
    <div style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }}>
      <div style={{ background:P.cream,padding:28,borderRadius:16,minWidth:300,maxWidth:340,width:"90%",textAlign:"center" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:P.dark,marginBottom:6 }}>¿Cómo quieres que te llame?</div>
        <div style={{ fontSize:13,color:P.mid,marginBottom:16 }}>Tu nombre aparecerá en el tracker.</div>
        <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&name.trim().length>=2&&onSave(name.trim())} placeholder="Tu nombre"
          style={{ width:"100%",background:P.white,border:`1.5px solid ${P.amber}55`,borderRadius:8,padding:"10px 12px",fontFamily:"'Inter',sans-serif",fontSize:15,color:P.dark,outline:"none",marginBottom:14 }}/>
        <button onClick={()=>{ if(name.trim().length>=2) onSave(name.trim()); }}
          style={{ width:"100%",background:`linear-gradient(135deg,${P.blue},${P.blueD})`,color:P.white,border:"none",borderRadius:10,padding:"11px 0",fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:600,cursor:"pointer" }}>
          Guardar
        </button>
      </div>
    </div>
  );
}

// ══════ MAIN ══════
export default function PortaVirtus() {
  const [history, setHistory] = useState(null), [tasks, setTasks] = useState(null), [user, setUser] = useState(null), [tab, setTab] = useState("today"), [tabKey, setTabKey] = useState(0), [showDebug, setShowDebug] = useState(false);
  useEffect(() => { loadData().then(({ history: h, tasks: t, user: u }) => { const rep = repairHistory(h || {}, t || DEFAULT_TASKS); setHistory(rep); setTasks(t || DEFAULT_TASKS); setUser(u); }); }, []);
  useEffect(() => { function onKey(e) { if (e.ctrlKey && e.key === "d") { e.preventDefault(); setShowDebug(s => !s); } } window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  const handleHistoryChange = useCallback(async raw => { const next = repairHistory(raw, tasks); setHistory(next); await saveData(next, tasks, user); }, [tasks, user]);
  const handleTasksChange = useCallback(async newTasks => { setTasks(newTasks); await saveData(history, newTasks, user); }, [history, user]);
  async function handleUserSave(name) { const u = { name }; setUser(u); await saveData(history, tasks, u); }
  function changeTab(k) { setTab(k); setTabKey(n => n + 1); }
  if (!history || !tasks) return (<div style={{ background: P.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: P.mid, letterSpacing: 2, animation: "pulse 1.4s ease infinite" }}>PORTA VIRTUS</div></div>);
  if (!user || !user.name) return <NameModal onSave={handleUserSave} />;
  const totalXP = computeXP(history, tasks), { current: streak } = computeStreaks(history), xpLevel = Math.floor(totalXP / 200), xpProgress = ((totalXP % 200) / 200) * 100, xpToNext = 200 - (totalXP % 200), perfectDays = computePerfectDays(history, tasks);
  const TABS = [{ k: "today", l: "Hoy" }, { k: "week", l: "Semana" }, { k: "monthly", l: "Mensual" }, { k: "annual", l: "Anual" }, { k: "badges", l: "Insignias" }, { k: "insights", l: "Insights" }, { k: "guide", l: "Guía" }, { k: "tasks", l: "Tareas" }];
  return (<div style={{ fontFamily: "'Inter',sans-serif", background: P.cream, minHeight: "100vh", color: P.dark, maxWidth: 520, margin: "0 auto", paddingBottom: 80 }}>
    <FontLoader />
    {showDebug && <DebugPanel history={history} tasks={tasks} onClose={() => setShowDebug(false)} />}
    <div style={{ background: P.blue }}>
      <div style={{ padding: "18px 20px 0", textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, letterSpacing: 4, background: `linear-gradient(90deg,${P.amberL},${P.amber},${P.amberD})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4, fontWeight: 300 }}>— PORTA VIRTUS —</div>
        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${P.amber}88,transparent)`, margin: "0 auto 14px", maxWidth: 200 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14 }}>
          <div style={{ textAlign: "left" }}><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: P.cream, fontWeight: 400, letterSpacing: 0.5 }}>{user.name}</div><div style={{ fontSize: 11, color: "#A8C4E0", letterSpacing: 0.5 }}>Tracker de desarrollo personal</div></div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: `${P.amber}22`, border: `1px solid ${P.amber}66`, borderRadius: 12, padding: "8px 14px" }}><div style={{ fontSize: 18 }}>🔥</div><div style={{ fontSize: 16, fontWeight: 600, color: P.amber, lineHeight: 1 }}>{streak}</div><div style={{ fontSize: 9, color: "#A8C4E0", marginTop: 1 }}>días</div></div>
        </div>
      </div>
      <div style={{ background: P.blueD, padding: "10px 16px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}><span style={{ fontSize: 11, color: "#A8C4E0", fontWeight: 600 }}>NIVEL {xpLevel + 1}</span><div style={{ display: "flex", gap: 12, alignItems: "center" }}><span style={{ fontSize: 11, color: P.amber, fontWeight: 600 }}>{totalXP} XP</span><span style={{ fontSize: 10, color: "#7099B8" }}>{xpToNext} para nivel {xpLevel + 2}</span></div></div>
        <div style={{ background: "#0E3260", borderRadius: 6, height: 8, overflow: "hidden" }}><div style={{ height: "100%", background: `linear-gradient(90deg,${P.amberL},${P.amber})`, borderRadius: 6, width: 0, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} ref={el => { if (el) setTimeout(() => { el.style.width = `${xpProgress}%`; }, 80) }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <div style={{ display: "flex", gap: 16 }}>{[["días", Object.keys(history).length], ["perfectos", perfectDays], ["racha máx", computeStreaks(history).longest]].map(([l, v]) => (<div key={l} style={{ fontSize: 10, color: "#7099B8" }}><span style={{ color: "#A8C4E0", fontWeight: 600 }}>{v}</span> {l}</div>))}</div>
          <DataStatusIndicator history={history} tasks={tasks} />
        </div>
      </div>
    </div>
    <div style={{ display: "flex", background: P.white, borderBottom: `1px solid ${P.cream}`, position: "sticky", top: 0, zIndex: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {TABS.map(({ k, l }) => { const active = tab === k; return (<button key={k} style={{ flex: 1, padding: "10px 0", fontSize: 10, fontWeight: active ? 600 : 400, color: active ? P.amber : P.mid, background: active ? `${P.amber}0D` : "transparent", border: "none", cursor: "pointer", borderBottom: active ? `2px solid ${P.amber}` : "2px solid transparent", fontFamily: "'Inter',sans-serif", transition: "color 0.18s,background 0.18s", marginBottom: -1 }} onClick={() => changeTab(k)}>{l}</button>); })}
    </div>
    <div key={tabKey} className="tab-content">
      {tab === "today"    && <TodayTab    history={history} tasks={tasks} onHistoryChange={handleHistoryChange} user={user} />}
      {tab === "week"     && <WeekTab     history={history} tasks={tasks} onHistoryChange={handleHistoryChange} />}
      {tab === "monthly"  && <MonthlyTab  history={history} tasks={tasks} />}
      {tab === "annual"   && <AnnualTab   history={history} tasks={tasks} />}
      {tab === "badges"   && <BadgesTab   history={history} tasks={tasks} />}
      {tab === "insights" && <InsightsTab history={history} tasks={tasks} />}
      {tab === "guide"    && <GuideTab    history={history} tasks={tasks} />}
      {tab === "tasks"    && <TasksTab    tasks={tasks} onTasksChange={handleTasksChange} user={user} onUserSave={handleUserSave} />}
    </div>
  </div>);
}
