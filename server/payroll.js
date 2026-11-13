const money = n => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
export function calculatePayroll({ staff, services = [], attendance = [], leaves = [], adjustments = [], extraWork = [], payments = [], settings = {}, month = new Date().toISOString().slice(0,7) }) {
  const start=`${month}-01`,end=`${month}-31`,inMonth=d=>d>=start&&d<=end;
  const monthLeaves=leaves.filter(x=>inMonth(x.leave_date));
  const cleaningAllowance=Number(staff?.free_cleaning_days_per_month??settings.free_cleaning_days_per_month??2);
  const leaveByDate=new Map(monthLeaves.map(x=>[x.leave_date,x.leave_type]));
  const mealAllowance=Number(staff?.free_missed_meals_per_month??settings.free_missed_meals_per_month??6);
  let base=0,cleanAbsences=0;
  const mealEvents=[],cleanAbsenceDates=new Set();
  const addMeals=(date,meals,source)=>meals.forEach(meal=>mealEvents.push({date,meal,source}));
  for(const leave of monthLeaves){
    const type=leave.leave_type;
    if(!['weekly_off','special_holiday'].includes(type)){
      addMeals(leave.leave_date,['breakfast','lunch','dinner'],type==='paid'?'paid holiday':'unpaid leave');
      cleanAbsenceDates.add(leave.leave_date);
    }
  }
  for(const service of services){
    base+=Number(service.monthly_base||0);
    const name=`${service.category||''} ${service.name||''}`.toLowerCase();
    const rows=attendance.filter(a=>a.service_id===service.id&&inMonth(a.attendance_date));
    if(/cook/.test(name))for(const row of rows){
      if(leaveByDate.has(row.attendance_date)||['weekly_off','special_holiday'].includes(row.status))continue;
      const tasks=row.tasks||{},meals=['breakfast','lunch','dinner'];
      const missed=row.status==='absent'?meals:meals.filter(meal=>tasks[meal]==='missed');
      addMeals(row.attendance_date,missed,'attendance');
    }
    if(/clean/.test(name))for(const row of rows){
      if(leaveByDate.has(row.attendance_date)||['weekly_off','special_holiday'].includes(row.status))continue;
      if(row.status==='absent')cleanAbsenceDates.add(row.attendance_date);
    }
  }
  mealEvents.sort((a,b)=>a.date.localeCompare(b.date)||['breakfast','lunch','dinner'].indexOf(a.meal)-['breakfast','lunch','dinner'].indexOf(b.meal));
  cleanAbsences=cleanAbsenceDates.size;
  const missedMeals=mealEvents.length,freeMealsUsed=Math.min(mealAllowance,missedMeals),chargeableMeals=Math.max(0,missedMeals-mealAllowance);
  const cookService=services.find(s=>/cook/i.test(`${s.category} ${s.name}`)),cleanService=services.find(s=>/clean/i.test(`${s.category} ${s.name}`));
  const cookDeduction=money(Math.min(Number(cookService?.monthly_base??4500),chargeableMeals*Number(cookService?.deduction_rate??50)));
  const cleanRate=Number(cleanService?.deduction_rate||Number(cleanService?.monthly_base??500)/Number(settings.cleaning_divisor||30));
  const freeCleaningDaysUsed=Math.min(cleaningAllowance,cleanAbsences),chargeableCleaningDays=Math.max(0,cleanAbsences-cleaningAllowance);
  const cleanDeduction=money(Math.min(Number(cleanService?.monthly_base??500),chargeableCleaningDays*cleanRate));
  const monthAdj=adjustments.filter(a=>inMonth(a.adjustment_date));
  const sum=category=>monthAdj.filter(x=>x.category===category).reduce((n,x)=>n+Number(x.amount),0);
  const advances=money(sum('advance')),bonuses=money(sum('bonus')),other=money(sum('other'));
  const extra=money(extraWork.filter(x=>inMonth(x.work_date)&&x.status==='approved').reduce((n,x)=>n+Number(x.amount),0));
  const paid=money(payments.filter(x=>String(x.salary_month).slice(0,7)===month).reduce((n,x)=>n+Number(x.amount),0));
  const deductions=money(cookDeduction+cleanDeduction),payable=money(Math.max(0,base-deductions+bonuses+extra+other-advances));
  return{staff,month,base:money(base),cooking_deduction:cookDeduction,cleaning_deduction:cleanDeduction,deductions,missed_meals:missedMeals,free_missed_meals:{allocated:mealAllowance,used:freeMealsUsed,remaining:Math.max(0,mealAllowance-freeMealsUsed)},chargeable_missed_meals:chargeableMeals,missed_meal_details:mealEvents.map((x,i)=>({...x,protected:i<mealAllowance})),cleaning_absences:cleanAbsences,free_cleaning_days:{allocated:cleaningAllowance,used:freeCleaningDaysUsed,remaining:Math.max(0,cleaningAllowance-freeCleaningDaysUsed)},chargeable_cleaning_days:chargeableCleaningDays,cleaning_absence_dates:[...cleanAbsenceDates].sort(),leave_history:monthLeaves.map(x=>({date:x.leave_date,type:x.leave_type,notes:x.notes||''})),bonuses,extra_work:extra,advances,other_adjustments:other,payable,paid,balance:money(Math.max(0,payable-paid)),payment_status:paid<=0?'Pending':paid>=payable?'Fully paid':'Partially paid'};
}
