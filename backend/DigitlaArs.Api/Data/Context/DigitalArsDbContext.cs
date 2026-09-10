using System;
using System.Collections.Generic;
using DigitalArs.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Data.Context;

public partial class DigitalArsDbContext : DbContext
{
    public DigitalArsDbContext(DbContextOptions<DigitalArsDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cuenta> Cuentas { get; set; }

    public virtual DbSet<Movimiento> Movimientos { get; set; }

    public virtual DbSet<Tipo_Movimiento> Tipo_Movimientos { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.UseCollation("Modern_Spanish_CI_AS");

        modelBuilder.Entity<Cuenta>(entity =>
        {
            entity.HasIndex(e => e.alias, "UQ_Cuentas_Alias").IsUnique();

            entity.HasIndex(e => e.cvu, "UQ_Cuentas_Cvu").IsUnique();

            entity.HasIndex(e => e.usuario_id, "UQ_Cuentas_UsuarioId").IsUnique();

            entity.Property(e => e.alias)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.cvu)
                .HasMaxLength(22)
                .IsUnicode(false);
            entity.Property(e => e.saldo).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.usuario).WithOne(p => p.Cuenta)
                .HasForeignKey<Cuenta>(d => d.usuario_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Cuentas_Usuarios");
        });

        modelBuilder.Entity<Movimiento>(entity =>
        {
            entity.Property(e => e.fecha).HasPrecision(3);
            entity.Property(e => e.importe).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.cuenta).WithMany(p => p.Movimientos)
                .HasForeignKey(d => d.cuenta_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Movimientos_Cuentas");

            entity.HasOne(d => d.tipo_movimiento).WithMany(p => p.Movimientos)
                .HasForeignKey(d => d.tipo_movimiento_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Movimientos_Tipo_Movimiento");
        });

        modelBuilder.Entity<Tipo_Movimiento>(entity =>
        {
            entity.ToTable("Tipo_Movimiento");

            entity.HasIndex(e => e.descripcion, "UQ_Tipo_Movimiento_Descripcion").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.descripcion).HasMaxLength(50);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasIndex(e => new { e.tipo_documento, e.nro_documento }, "UQ_Usuarios_Documento").IsUnique();

            entity.HasIndex(e => e.email, "UQ_Usuarios_Email").IsUnique();

            entity.Property(e => e.apellido)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.email).HasMaxLength(256);
            entity.Property(e => e.identity_user_id).HasMaxLength(450);
            entity.Property(e => e.is_active).HasDefaultValue(true, "DF_Usuarios_IsActive");
            entity.Property(e => e.nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.nro_documento).HasMaxLength(20);
            entity.Property(e => e.tipo_documento).HasMaxLength(20);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
