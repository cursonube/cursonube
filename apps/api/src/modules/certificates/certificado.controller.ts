import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AlumnoAuthGuard } from '../../common/security/alumno-auth.guard';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { CertificadoService } from './certificado.service';

@ApiTags('certificates')
@UseGuards(AlumnoAuthGuard)
@Controller('certificados')
export class CertificadoController {
  constructor(private readonly certificadoService: CertificadoService) {}

  @Get()
  listMios(@CurrentUser() user: SessionTokenPayload) {
    return this.certificadoService.listMios(user.sub);
  }

  @Get(':id/descargar')
  async descargar(
    @Param('id') id: string,
    @CurrentUser() user: SessionTokenPayload,
    @Res() res: Response,
  ) {
    const pdf = await this.certificadoService.getPdfParaDescarga(id, user.sub);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificado-${id}.pdf"`,
    );
    res.send(pdf);
  }
}
