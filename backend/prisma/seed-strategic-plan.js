/**
 * Dedicated Seed Script for BRU Strategic Planning Architecture
 * -------------------------------------------------------------
 * S1 - S4: ประเด็นการพัฒนาท้องถิ่น (เอาแบบนี้เป๊ะๆ 4 ด้าน)
 * 1. การพัฒนาท้องถิ่นด้านเศรษฐกิจ
 * 2. การพัฒนาท้องถิ่นด้านสังคม
 * 3. การพัฒนาท้องถิ่นด้านสิ่งแวดล้อม
 * 4. การพัฒนาท้องถิ่นด้านการศึกษา
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🌱 Updating Strategies to exact 4 Local Development Issues...');
  console.log('====================================================');

  const strategiesData = [
    {
      code: 'S1',
      name: 'การพัฒนาท้องถิ่นด้านเศรษฐกิจ',
      subStrategies: [
        {
          code: 'SS1.1',
          name: 'การใช้ BCG MODEL ในการยกระดับเศรษฐกิจของคนในชุมชนท้องถิ่น',
          projects: [
            {
              code: 'MP1.1',
              name: 'โครงการพัฒนาคุณภาพชีวิต ผ่านโมเดลเศรษฐกิจทฤษฎีใหม่เพื่อยกระดับรายได้ครัวเรือนของชุมชน ท้องถิ่นอย่างยั่งยืน'
            }
          ]
        },
        {
          code: 'SS1.2',
          name: 'การใช้แนวคิดเศรษฐกิจสร้างสรรค์ในการยกระดับเศรษฐกิจของคนในชุมชน รวมถึงการนำประเด็นSoft power มาปรับใช้',
          projects: [
            {
              code: 'MP1.2',
              name: 'โครงการยกระดับเศรษฐกิจชุมชนเชิงสร้างสรรค์เพื่อสร้างมูลค่าผลิตภัณฑ์ทางภูมิปัญญาของชุมชนท้องถิ่น'
            },
            {
              code: 'MP1.3',
              name: 'โครงการยกระดับผลิตภัณฑ์ผ้าพื้นเมืองของกลุ่มอารยธรรมท้องถิ่นสู่เชิงพานิชย์'
            }
          ]
        }
      ]
    },
    {
      code: 'S2',
      name: 'การพัฒนาท้องถิ่นด้านสังคม',
      subStrategies: [
        {
          code: 'SS2.1',
          name: 'การทำนุบำรุงศิลปวัฒนธรรมและภูมิปัญญาท้องถิ่น สร้างความภาคภูมิใจให้คนในชุมชน ยึดโยงกับรากเหง้าเกิดความสามัคคีและมั่นคงในสถาบันหลักของชาติ',
          projects: [
            {
              code: 'MP2.1',
              name: 'โครงการอนุรักษ์ และเผยแพร่รากอารยะของกลุ่มชาติพันธุ์ในชุมชนท้องถิ่นสู่มรดกทางวัฒนธรรม'
            }
          ]
        },
        {
          code: 'SS2.2',
          name: 'การเสริมสร้างสุขภาวะทางร่างกาย ทางจิตใจ และทางจิตวิญญาณหรือปัญญาให้กับคนในชุมชนท้องถิ่น',
          projects: [
            {
              code: 'MP2.2',
              name: 'โครงการเสริมสร้างคุณภาพชีวิตเพื่อพัฒนาสุขภาวะที่ดีให้กับประชาชนในชุมชนท้องถิ่นอย่างยั่งยืน'
            }
          ]
        }
      ]
    },
    {
      code: 'S3',
      name: 'การพัฒนาท้องถิ่นด้านสิ่งแวดล้อม',
      subStrategies: [
        {
          code: 'SS3.1',
          name: 'การสร้างการมีส่วนร่วมในการบริหารจัดการ บำรุงรักษาและใช้ประโยชน์ทรัพยากรธรรมชาติและสิ่งแวดล้อมของคนในชุมชนท้องถิ่นอย่างสมดุลและยั่งยืน',
          projects: [
            {
              code: 'MP3.1',
              name: 'โครงการส่งเสริมการมีส่วนร่วมเพื่อบริหารจัดการทรัพยากรธรรมชาติและสิ่งแวดล้อมในชุมชนท้องถิ่นอย่างเป็นระบบที่ยั่งยืน'
            }
          ]
        },
        {
          code: 'SS3.2',
          name: 'การสร้างความตระหนักรู้ และแนวทางการรองรับปรับตัวต่อผลกระทบด้านการเปลี่ยนแปลงสภาพภูมิอากาศของคนในชุมชนท้องถิ่น',
          projects: [
            {
              code: 'MP3.2',
              name: 'โครงการเสริมสร้างทักษะการปรับตัวและสร้างภูมิต้านทานให้กับประชาชนในชุมชนท้องถิ่นเพื่อรองรับการเปลี่ยนแปลงทางสภาพภูมิอากาศ'
            }
          ]
        }
      ]
    },
    {
      code: 'S4',
      name: 'การพัฒนาท้องถิ่นด้านการศึกษา',
      subStrategies: [
        {
          code: 'SS4.1',
          name: 'การเสริมสร้างทักษะ/ความสามารถที่จำเป็นสาหรับการจัดการเรียนการสอนของครูในพื้นที่ ซึ่งต้องสามารถวัดประเมินผลได้อย่างเป็นรูปธรรม',
          projects: [
            {
              code: 'MP4.1',
              name: 'โครงการเสริมสร้างทักษะการจัดการเรียนการสอนของครูเพื่อยกระดับการศึกษาในชุมชนท้องถิ่น อย่างยั่งยืน'
            },
            {
              code: 'MP4.2',
              name: 'โครงการพัฒนามาตรฐานโรงเรียนสาธิต'
            }
          ]
        },
        {
          code: 'SS4.2',
          name: 'การเสริมสร้างทักษะ/ความสามารถที่จำเป็นในการใช้ชีวิตในสังคมให้กับคนในชุมชนท้องถิ่นด้วยกระบวนการวิศวกรสังคม',
          projects: [
            {
              code: 'MP4.3',
              name: 'โครงการเสริมสร้างทักษะความสามารถเชิงสมรรถนะด้วยกระบวนการวิศวกรสังคมโดยใช้ชุมชนท้องถิ่นเป็นฐาน'
            }
          ]
        }
      ]
    }
  ];

  // 1. Delete extra S5, S6 if any
  const extraStrategies = await prisma.strategy.findMany({
    where: { code: { in: ['S5', 'S6'] } },
    include: {
      subStrategies: {
        include: {
          indicators: { include: { projects: true } },
          projects: true
        }
      }
    }
  });

  for (const s of extraStrategies) {
    for (const ss of s.subStrategies) {
      for (const ind of ss.indicators) {
        if (ind.projects.length === 0) {
          await prisma.indicator.delete({ where: { id: ind.id } });
        }
      }
      if (ss.projects.length === 0) {
        await prisma.subStrategy.delete({ where: { id: ss.id } });
      }
    }
    await prisma.strategy.delete({ where: { id: s.id } });
  }

  // 2. Clean old IND records
  const oldIndicators = await prisma.indicator.findMany({
    where: { code: { startsWith: 'IND' } },
    include: { projects: true }
  });
  for (const oldInd of oldIndicators) {
    if (oldInd.projects.length === 0) {
      await prisma.indicator.delete({ where: { id: oldInd.id } });
    }
  }

  // 3. Upsert S1 to S4 with exact 4 local development issues
  for (const s of strategiesData) {
    const strat = await prisma.strategy.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: { code: s.code, name: s.name }
    });
    console.log(`\n🏛️ [${strat.code}] ${strat.name}`);

    for (const ss of s.subStrategies) {
      const subStrat = await prisma.subStrategy.upsert({
        where: { code: ss.code },
        update: { name: ss.name, strategyId: strat.id },
        create: { code: ss.code, name: ss.name, strategyId: strat.id }
      });
      console.log(`   ↳ 🔹 [${subStrat.code}] ${subStrat.name}`);

      for (const p of ss.projects) {
        const record = await prisma.indicator.upsert({
          where: { code: p.code },
          update: { name: p.name, subStrategyId: subStrat.id },
          create: { code: p.code, name: p.name, subStrategyId: subStrat.id }
        });
        console.log(`      ↳ 📌 [${record.code}] ${record.name}`);
      }
    }
  }

  console.log('\n====================================================');
  console.log('🎉 Successfully synced exact 4 Local Development Issues!');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error updating strategies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
