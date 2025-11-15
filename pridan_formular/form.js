(function(){
  const steps = Array.from(document.querySelectorAll('.step'));
  const stopBox = document.getElementById('stopBox');
  const form = document.getElementById('wizardForm');
  const debug = document.getElementById('debug');

  function showStep(i){ steps.forEach((s,idx)=> s.classList.toggle('active', idx===i)); }
  function activeIndex(){ return steps.findIndex(s=> s.classList.contains('active')); }
  function values(){
    const v = {
      consents:{
        wellness_only: document.getElementById('c_wellness').checked,
        gdpr_health: document.getElementById('c_gdpr').checked,
        adult_or_guardian: document.getElementById('c_age').checked,
        instant_digital_delivery: document.getElementById('c_delivery').checked
      }
    };
    return v;
  }
  function validate(i){
    const v = values();
    if (i===0 && (!v.consents.wellness_only||!v.consents.gdpr_health||!v.consents.adult_or_guardian)){
      alert('Zaškrtněte prosím povinné souhlasy.'); return false;
    }
    return true;
  }
  document.addEventListener('click', (e)=>{
    if (e.target.classList.contains('next')){
      const i=activeIndex(); if(!validate(i)) return; showStep(Math.min(i+1, steps.length-1));
    }
  });
  form.addEventListener('submit', (e)=>{ e.preventDefault(); debug.textContent = JSON.stringify(values(), null, 2); debug.classList.remove('hidden'); alert('Formulář připraven.'); });
  showStep(0);
})();
