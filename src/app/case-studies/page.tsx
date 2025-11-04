import CaseStudiesHero from '@/components/sections/case-studies/CaseStudiesHero';
import ReasonsSection from '@/components/sections/case-studies/ReasonsSection';
import CostLossSection from '@/components/sections/case-studies/CostLossSection';
import AnnualizedLosses from '@/components/sections/case-studies/AnnualizedLosses';
import SurveyMethodology from '@/components/sections/case-studies/SurveyMethodology';

export default function CaseStudiesPage() {
  return (
    <>
      <CaseStudiesHero />
      <ReasonsSection />
      <CostLossSection />
      <AnnualizedLosses />
      <SurveyMethodology />
    </>
  );
}
